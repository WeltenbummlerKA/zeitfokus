package timespan

import (
	"context"
	"errors"
	"sort"
	"strings"

	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
)

// History returns a filtered, user-scoped history and totals over the complete match set.
// Pagination is applied only after filtering and summing so totals never depend on the loaded page.
func (r *ResolverForTimeSpan) History(ctx context.Context, filter *gqlmodel.InputHistoryFilter, cursor *gqlmodel.InputCursor) (*gqlmodel.HistoryResult, error) {
	user := auth.GetUser(ctx)
	if filter != nil && filter.From != nil && filter.ToExclusive != nil && !filter.From.Time().Before(filter.ToExclusive.Time()) {
		return nil, errors.New("history range must have from before toExclusive")
	}
	page := normalizeHistoryCursor(cursor)
	var snapshot int
	if page.StartID != nil {
		snapshot = *page.StartID
	} else {
		var maxID int
		if err := r.DB.Model(new(model.TimeSpan)).Where("user_id = ?", user.ID).Select("coalesce(max(id), 0)").Row().Scan(&maxID); err != nil {
			return nil, err
		}
		snapshot = maxID
	}

	var spans []model.TimeSpan
	if err := r.DB.Preload("Tags").Where("user_id = ? AND id <= ?", user.ID, snapshot).Not("end_user_time is NULL").Find(&spans).Error; err != nil {
		return nil, err
	}
	matches := make([]model.TimeSpan, 0, len(spans))
	total := 0.0
	for _, span := range spans {
		if !historyMatches(span, filter) {
			continue
		}
		matches = append(matches, span)
		total += historySeconds(span, filter)
	}
	sort.SliceStable(matches, func(i, j int) bool {
		if matches[i].StartUTC.Equal(matches[j].StartUTC) {
			return matches[i].ID > matches[j].ID
		}
		return matches[i].StartUTC.After(matches[j].StartUTC)
	})
	offset := *page.Offset
	if offset > len(matches) {
		offset = len(matches)
	}
	end := offset + *page.PageSize
	if end > len(matches) {
		end = len(matches)
	}
	result := make([]*gqlmodel.TimeSpan, 0, end-offset)
	for _, span := range matches[offset:end] {
		result = append(result, timeSpanToExternal(span))
	}
	return &gqlmodel.HistoryResult{
		TimeSpans:     result,
		MatchingCount: len(matches),
		TotalSeconds:  total,
		Cursor:        &gqlmodel.Cursor{HasMore: end < len(matches), Offset: end, StartID: snapshot, PageSize: *page.PageSize},
	}, nil
}

func normalizeHistoryCursor(cursor *gqlmodel.InputCursor) *gqlmodel.InputCursor {
	if cursor == nil {
		cursor = &gqlmodel.InputCursor{}
	}
	maxPageSize := 100
	if cursor.PageSize == nil || *cursor.PageSize < 1 || *cursor.PageSize > maxPageSize {
		cursor.PageSize = &maxPageSize
	}
	if cursor.Offset == nil || *cursor.Offset < 0 {
		zero := 0
		cursor.Offset = &zero
	}
	return cursor
}

func historyMatches(span model.TimeSpan, filter *gqlmodel.InputHistoryFilter) bool {
	if filter == nil {
		return true
	}
	if filter.From != nil && !span.EndUTC.After(filter.From.Time()) {
		return false
	}
	if filter.ToExclusive != nil && !span.StartUTC.Before(filter.ToExclusive.Time()) {
		return false
	}
	if filter.Query != nil {
		query := strings.ToLower(strings.TrimSpace(*filter.Query))
		if query != "" {
			found := strings.Contains(strings.ToLower(span.Note), query)
			for _, tag := range span.Tags {
				found = found || strings.Contains(strings.ToLower(tag.Key), query) || strings.Contains(strings.ToLower(tag.StringValue), query)
			}
			if !found {
				return false
			}
		}
	}
	for _, required := range filter.RequireTags {
		if !hasHistoryTag(span, required) {
			return false
		}
	}
	for _, excluded := range filter.ExcludeTags {
		if hasHistoryTag(span, excluded) {
			return false
		}
	}
	return true
}

func hasHistoryTag(span model.TimeSpan, wanted *gqlmodel.InputTimeSpanTag) bool {
	if wanted == nil {
		return false
	}
	for _, tag := range span.Tags {
		if tag.Key == wanted.Key && tag.StringValue == wanted.Value {
			return true
		}
	}
	return false
}

func historySeconds(span model.TimeSpan, filter *gqlmodel.InputHistoryFilter) float64 {
	start := span.StartUTC
	if span.EndUTC == nil {
		return 0
	}
	end := *span.EndUTC
	if filter != nil && filter.From != nil && start.Before(filter.From.Time()) {
		start = filter.From.Time()
	}
	if filter != nil && filter.ToExclusive != nil && end.After(filter.ToExclusive.Time()) {
		end = filter.ToExclusive.Time()
	}
	if !end.After(start) {
		return 0
	}
	return end.Sub(start).Seconds()
}
