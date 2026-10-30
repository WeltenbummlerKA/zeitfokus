package graphql

import (
	"context"
	"errors"
	"time"

	"github.com/traggo/server/ai"
	"github.com/traggo/server/auth"
	"github.com/traggo/server/dashboard"
	"github.com/traggo/server/favorite"
	"github.com/traggo/server/setting"

	"github.com/jinzhu/copier"
	"github.com/jinzhu/gorm"
	"github.com/traggo/server/device"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/generated/gqlschema"
	"github.com/traggo/server/model"
	"github.com/traggo/server/statistics"
	"github.com/traggo/server/tag"
	"github.com/traggo/server/timespan"
	"github.com/traggo/server/user"
)

// NewResolver combines all resolvers to a resolver root.

func NewResolver(db *gorm.DB, passStrength int, version model.Version, aiConfigs ...ai.ProviderConfig) gqlschema.ResolverRoot {
	provider := ai.ProviderConfig{Provider: "disabled"}
	if len(aiConfigs) > 0 { provider = aiConfigs[0] }
	return &resolver{
		ResolverForUser: user.ResolverForUser{
			DB:           db,
			PassStrength: passStrength,
		},
		ResolverForTag: tag.ResolverForTag{
			DB: db,
		},
		ResolverForDevice: device.ResolverForDevice{
			DB: db,
		},
		ResolverForTimeSpan: timespan.ResolverForTimeSpan{
			DB: db,
		},
		ResolverForStatistics: statistics.ResolverForStatistics{
			DB: db,
		},
		ResolverForSettings: setting.ResolverForSettings{
			DB: db,
		},
		ResolverForFavorite:  favorite.ResolverForFavorite{DB: db},
		ResolverForDashboard: dashboard.NewResolverForDashboard(db),
		version:              version,
		aiProvider:           provider,
	}
}

type resolver struct {
	user.ResolverForUser
	tag.ResolverForTag
	device.ResolverForDevice
	timespan.ResolverForTimeSpan
	statistics.ResolverForStatistics
	version model.Version
	setting.ResolverForSettings
	favorite.ResolverForFavorite
	dashboard.ResolverForDashboard
	aiProvider ai.ProviderConfig
}

func (r *resolver) RootMutation() gqlschema.RootMutationResolver {
	return r
}

func (r *resolver) RootQuery() gqlschema.RootQueryResolver {
	return r
}

func (r *resolver) Version(ctx context.Context) (*gqlmodel.Version, error) {
	gql := &gqlmodel.Version{}
	if err := copier.Copy(gql, r.version); err != nil { return nil, err }
	return gql, nil
}

func (r *resolver) AnalyzeTimeReport(ctx context.Context, input gqlmodel.InputAIAnalysis) (*gqlmodel.AIAnalysisResult, error) {
	if err := r.aiProvider.Validate(); err != nil { return nil, err }
	if r.aiProvider.Provider == "disabled" || r.aiProvider.Provider == "" { return nil, errors.New("AI analysis is disabled") }
	if !input.From.Time().Before(input.ToExclusive.Time()) { return nil, errors.New("AI analysis range must have from before toExclusive") }
	user := auth.GetUser(ctx)
	var spans []model.TimeSpan
	if err := r.ResolverForTimeSpan.DB.Preload("Tags").Where("user_id = ? AND end_user_time IS NOT NULL AND start_user_time < ? AND end_user_time > ?", user.ID, input.ToExclusive.Time(), input.From.Time()).Find(&spans).Error; err != nil { return nil, err }
	// Clip each span to the requested range before aggregation.
	for i := range spans {
		if spans[i].StartUTC.Before(input.From.Time()) { spans[i].StartUTC = input.From.Time() }
		if spans[i].EndUTC != nil && spans[i].EndUTC.After(input.ToExclusive.Time()) { end := input.ToExclusive.Time(); spans[i].EndUTC = &end }
	}
	loc := input.From.Time().Location()
	if loc == nil { loc = time.UTC }
	summary := ai.Summarize(spans, loc)
	text, err := ai.Analyze(ctx, r.aiProvider, summary)
	if err != nil { return nil, err }
	return &gqlmodel.AIAnalysisResult{Text: text, From: model.Time(summary.From), To: model.Time(summary.To), CompletedEntries: summary.CompletedEntries, TotalSeconds: float64(summary.TotalSeconds), AverageSeconds: float64(summary.AverageSeconds), DaysWithActivity: summary.DaysWithActivity}, nil
}
