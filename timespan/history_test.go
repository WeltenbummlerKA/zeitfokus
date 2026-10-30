package timespan

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
)

func TestHistoryFiltersAndTotalsAcrossPages(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(5)
	db.Create(&model.TimeSpan{ID: 1, UserID: 5, StartUTC: test.Time("2025-01-01T10:00:00Z"), EndUTC: test.TimeP("2025-01-01T10:10:00Z"), StartUserTime: test.Time("2025-01-01T10:00:00Z"), EndUserTime: test.TimeP("2025-01-01T10:10:00Z"), Note: "review"})
	db.Create(&model.TimeSpan{ID: 2, UserID: 5, StartUTC: test.Time("2025-01-01T09:00:00Z"), EndUTC: test.TimeP("2025-01-01T09:20:00Z"), StartUserTime: test.Time("2025-01-01T09:00:00Z"), EndUserTime: test.TimeP("2025-01-01T09:20:00Z"), Note: "review"})
	db.Create(&model.TimeSpan{ID: 3, UserID: 2, StartUTC: test.Time("2025-01-01T08:00:00Z"), EndUTC: test.TimeP("2025-01-01T09:00:00Z"), StartUserTime: test.Time("2025-01-01T08:00:00Z"), EndUserTime: test.TimeP("2025-01-01T09:00:00Z"), Note: "review"})

	query := "review"
	pageSize := 1
	result, err := (&ResolverForTimeSpan{DB: db.DB}).History(fake.User(5), &gqlmodel.InputHistoryFilter{Query: &query}, &gqlmodel.InputCursor{PageSize: &pageSize})
	require.NoError(t, err)
	require.Len(t, result.TimeSpans, 1)
	require.Equal(t, 2, result.MatchingCount)
	require.Equal(t, 1800.0, result.TotalSeconds)
	require.True(t, result.Cursor.HasMore)
}
