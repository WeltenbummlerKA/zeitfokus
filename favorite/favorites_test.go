package favorite

import (
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
)

func TestFavoritesCRUDScopedToSession(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	db.User(2)
	r := &ResolverForFavorite{DB: db.DB}
	input := gqlmodel.InputFavorite{Title: "  Review  ", Note: "Review project", Position: 2, Tags: []*gqlmodel.InputTimeSpanTag{{Key: "project", Value: "Zeitfokus"}}}
	saved, err := r.CreateFavorite(fake.User(1), input)
	require.NoError(t, err)
	require.Equal(t, "Review", saved.Title)
	require.Len(t, saved.Tags, 1)
	own, err := r.Favorites(fake.User(1))
	require.NoError(t, err)
	require.Len(t, own, 1)
	other, err := r.Favorites(fake.User(2))
	require.NoError(t, err)
	require.Empty(t, other)
	_, err = r.UpdateFavorite(fake.User(2), saved.ID, input)
	require.EqualError(t, err, "favorite not found")
	_, err = r.RemoveFavorite(fake.User(2), saved.ID)
	require.EqualError(t, err, "favorite not found")
	input.Title, input.Note, input.Position, input.Tags = "Updated", "", 0, nil
	updated, err := r.UpdateFavorite(fake.User(1), saved.ID, input)
	require.NoError(t, err)
	require.Empty(t, updated.Note)
	require.Empty(t, updated.Tags)
	require.Zero(t, updated.Position)
	own, err = r.Favorites(fake.User(1))
	require.NoError(t, err)
	require.Equal(t, updated, own[0])
	removed, err := r.RemoveFavorite(fake.User(1), saved.ID)
	require.NoError(t, err)
	require.Equal(t, updated, removed)
	own, err = r.Favorites(fake.User(1))
	require.NoError(t, err)
	require.Empty(t, own)
}

func TestFavoritesRequireAuthentication(t *testing.T) {
	r := &ResolverForFavorite{}
	ctx := context.Background()
	_, err := r.Favorites(ctx)
	require.EqualError(t, err, "authentication required")
	_, err = r.CreateFavorite(ctx, gqlmodel.InputFavorite{})
	require.EqualError(t, err, "authentication required")
	_, err = r.UpdateFavorite(ctx, 1, gqlmodel.InputFavorite{})
	require.EqualError(t, err, "authentication required")
	_, err = r.RemoveFavorite(ctx, 1)
	require.EqualError(t, err, "authentication required")
}

func TestInvalidFavoritesDoNotMutateStoredData(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	r := &ResolverForFavorite{DB: db.DB}
	saved, err := r.CreateFavorite(fake.User(1), gqlmodel.InputFavorite{Title: "Keep", Note: "Original"})
	require.NoError(t, err)
	cases := []gqlmodel.InputFavorite{
		{Title: " "}, {Title: strings.Repeat("ü", 101)}, {Title: "Long", Note: strings.Repeat("a", 501)},
		{Title: "Position", Position: -1}, {Title: "Tag", Tags: []*gqlmodel.InputTimeSpanTag{nil}},
		{Title: "Tag", Tags: []*gqlmodel.InputTimeSpanTag{{Key: ""}}},
		{Title: "Tag", Tags: []*gqlmodel.InputTimeSpanTag{{Key: "same"}, {Key: "same"}}},
	}
	for _, input := range cases {
		_, err := r.UpdateFavorite(fake.User(1), saved.ID, input)
		require.Error(t, err)
	}
	entries, err := r.Favorites(fake.User(1))
	require.NoError(t, err)
	require.Equal(t, []*gqlmodel.Favorite{saved}, entries)
}

func TestFavoritesDeletedWithUserAndDatabaseErrorsSurface(t *testing.T) {
	db := test.InMemoryDB(t)
	db.User(1)
	r := &ResolverForFavorite{DB: db.DB}
	_, err := r.CreateFavorite(fake.User(1), gqlmodel.InputFavorite{Title: "Private"})
	require.NoError(t, err)
	require.NoError(t, db.Delete(&model.User{ID: 1}).Error)
	var count int
	require.NoError(t, db.Model(&model.Favorite{}).Count(&count).Error)
	require.Zero(t, count)
	db.Close()
	_, err = r.Favorites(fake.User(1))
	require.Error(t, err)
	_, err = r.CreateFavorite(fake.User(1), gqlmodel.InputFavorite{Title: "Private"})
	require.Error(t, err)
}
