package setting

import (
	"context"
	"encoding/json"
	"errors"
	"math"

	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
)

// SetWorkTargetProfile stores only the authenticated user's optional work target.
func (r *ResolverForSettings) SetWorkTargetProfile(ctx context.Context, profile gqlmodel.InputWorkTargetProfile) (*gqlmodel.UserSettings, error) {
	if auth.GetUser(ctx) == nil {
		return nil, errors.New("authentication required")
	}
	if err := validateWorkTargetProfile(profile); err != nil {
		return nil, err
	}
	internal, err := Get(ctx, r.DB)
	if err != nil {
		return nil, err
	}
	days := make([]gqlmodel.WeekDay, len(profile.WorkDays))
	copy(days, profile.WorkDays)
	encoded, err := json.Marshal(gqlmodel.WorkTargetProfile{Enabled: profile.Enabled, WeeklyHours: profile.WeeklyHours, WorkDays: days})
	if err != nil {
		return nil, err
	}
	value := string(encoded)
	internal.UserID = auth.GetUser(ctx).ID
	internal.WorkTargetProfileJSON = &value
	if err := r.DB.Save(&internal).Error; err != nil {
		return nil, err
	}
	return toExternal(internal), nil
}

func validateWorkTargetProfile(profile gqlmodel.InputWorkTargetProfile) error {
	if math.IsNaN(profile.WeeklyHours) || math.IsInf(profile.WeeklyHours, 0) || profile.WeeklyHours < 0 || profile.WeeklyHours > 168 {
		return errors.New("weekly target must be between 0 and 168 hours")
	}
	seen := make(map[gqlmodel.WeekDay]bool)
	for _, day := range profile.WorkDays {
		if !day.IsValid() || seen[day] {
			return errors.New("work days must be unique valid weekdays")
		}
		seen[day] = true
	}
	if profile.Enabled && (profile.WeeklyHours <= 0 || len(profile.WorkDays) == 0) {
		return errors.New("an enabled target requires weekly hours and at least one work day")
	}
	return nil
}

func externalWorkTargetProfile(encoded *string) *gqlmodel.WorkTargetProfile {
	if encoded == nil {
		return nil
	}
	var profile gqlmodel.WorkTargetProfile
	if err := json.Unmarshal([]byte(*encoded), &profile); err != nil {
		return nil
	}
	if err := validateWorkTargetProfile(gqlmodel.InputWorkTargetProfile{Enabled: profile.Enabled, WeeklyHours: profile.WeeklyHours, WorkDays: profile.WorkDays}); err != nil {
		return nil
	}
	if profile.WorkDays == nil {
		profile.WorkDays = []gqlmodel.WeekDay{}
	}
	return &profile
}
