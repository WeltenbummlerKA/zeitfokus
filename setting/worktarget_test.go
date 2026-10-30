package setting

import (
	"context"
	"math"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
)

func TestWorkTargetProfileIsOptInAndPerUser(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	db.User(2)
	r := &ResolverForSettings{DB: db.DB}
	initial, err := r.UserSettings(fake.User(1))
	require.NoError(t, err)
	require.Nil(t, initial.WorkTargetProfile)
	profile := gqlmodel.InputWorkTargetProfile{Enabled: true, WeeklyHours: 32.5, WorkDays: []gqlmodel.WeekDay{gqlmodel.WeekDayMonday, gqlmodel.WeekDayThursday}}
	saved, err := r.SetWorkTargetProfile(fake.User(1), profile)
	require.NoError(t, err)
	require.True(t, saved.WorkTargetProfile.Enabled)
	require.Equal(t, profile.WeeklyHours, saved.WorkTargetProfile.WeeklyHours)
	other, err := r.UserSettings(fake.User(2))
	require.NoError(t, err)
	require.Nil(t, other.WorkTargetProfile)

	_, err = r.SetUserSettings(fake.User(1), gqlmodel.InputUserSettings{Theme: gqlmodel.ThemeMaterialLight, DateLocale: gqlmodel.DateLocaleGerman, FirstDayOfTheWeek: gqlmodel.WeekDayMonday, DateTimeInputStyle: gqlmodel.DateTimeInputStyleNative})
	require.NoError(t, err)
	_, err = r.SetInterfaceLanguage(fake.User(1), gqlmodel.InterfaceLanguageEnglish)
	require.NoError(t, err)
	kept, err := r.UserSettings(fake.User(1))
	require.NoError(t, err)
	require.Equal(t, saved.WorkTargetProfile, kept.WorkTargetProfile)
	profile.Enabled = false
	disabled, err := r.SetWorkTargetProfile(fake.User(1), profile)
	require.NoError(t, err)
	require.False(t, disabled.WorkTargetProfile.Enabled)
	require.Equal(t, profile.WeeklyHours, disabled.WorkTargetProfile.WeeklyHours)
	require.Equal(t, profile.WorkDays, disabled.WorkTargetProfile.WorkDays)
	require.Equal(t, gqlmodel.ThemeMaterialLight, disabled.Theme)
	require.Equal(t, gqlmodel.InterfaceLanguageEnglish, *disabled.InterfaceLanguage)
}

func TestWorkTargetProfileRejectsInvalidInput(t *testing.T) {
	for _, profile := range []gqlmodel.InputWorkTargetProfile{
		{Enabled: true, WeeklyHours: 0, WorkDays: []gqlmodel.WeekDay{gqlmodel.WeekDayMonday}},
		{Enabled: true, WeeklyHours: 40},
		{WeeklyHours: -1},
		{WeeklyHours: 169},
		{WeeklyHours: math.NaN()},
		{WeeklyHours: math.Inf(1)},
		{WeeklyHours: 40, WorkDays: []gqlmodel.WeekDay{gqlmodel.WeekDayMonday, gqlmodel.WeekDayMonday}},
		{WeeklyHours: 40, WorkDays: []gqlmodel.WeekDay{"invalid"}},
	} {
		require.Error(t, validateWorkTargetProfile(profile))
	}
	require.NoError(t, validateWorkTargetProfile(gqlmodel.InputWorkTargetProfile{Enabled: false}))
	r := &ResolverForSettings{}
	_, err := r.SetWorkTargetProfile(context.Background(), gqlmodel.InputWorkTargetProfile{})
	require.EqualError(t, err, "authentication required")
}

func TestInvalidStoredWorkTargetProfileIsDisabled(t *testing.T) {
	invalid := "not-json"
	require.Nil(t, externalWorkTargetProfile(&invalid))
	invalid = `{"enabled":true,"weeklyHours":-10,"workDays":["Monday"]}`
	require.Nil(t, externalWorkTargetProfile(&invalid))
}
