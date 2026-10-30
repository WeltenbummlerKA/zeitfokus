package favorite

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
)

func userID(ctx context.Context) (int, error) {
	user := auth.GetUser(ctx)
	if user == nil {
		return 0, errors.New("authentication required")
	}
	return user.ID, nil
}

// Favorites never accepts a user parameter: the session owns every result.
func (r *ResolverForFavorite) Favorites(ctx context.Context) ([]*gqlmodel.Favorite, error) {
	owner, err := userID(ctx)
	if err != nil {
		return nil, err
	}
	var records []model.Favorite
	if err := r.DB.Where("user_id = ?", owner).Order("position ASC, id ASC").Find(&records).Error; err != nil {
		return nil, err
	}
	result := make([]*gqlmodel.Favorite, 0, len(records))
	for _, record := range records {
		external, err := toExternal(record)
		if err != nil {
			return nil, err
		}
		result = append(result, external)
	}
	return result, nil
}

func favoriteInput(input gqlmodel.InputFavorite) (model.Favorite, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" || utf8.RuneCountInString(title) > 100 || utf8.RuneCountInString(input.Note) > 500 || input.Position < 0 || input.Position > 1000000 || len(input.Tags) > 50 {
		return model.Favorite{}, errors.New("invalid favorite: title, description, tags or position out of bounds")
	}
	tags := make([]*gqlmodel.TimeSpanTag, 0, len(input.Tags))
	seen := map[string]bool{}
	for _, tag := range input.Tags {
		if tag == nil || tag.Key == "" || len(tag.Key) > 256 || len(tag.Value) > 4096 || seen[tag.Key+"\x00"+tag.Value] {
			return model.Favorite{}, errors.New("invalid favorite tags")
		}
		seen[tag.Key+"\x00"+tag.Value] = true
		tags = append(tags, &gqlmodel.TimeSpanTag{Key: tag.Key, Value: tag.Value})
	}
	encoded, err := json.Marshal(tags)
	if err != nil {
		return model.Favorite{}, err
	}
	return model.Favorite{Title: title, Note: input.Note, Position: input.Position, TagsJSON: string(encoded)}, nil
}

func toExternal(record model.Favorite) (*gqlmodel.Favorite, error) {
	tags := []*gqlmodel.TimeSpanTag{}
	if err := json.Unmarshal([]byte(record.TagsJSON), &tags); err != nil {
		return nil, errors.New("favorite data could not be read")
	}
	return &gqlmodel.Favorite{ID: record.ID, Title: record.Title, Note: record.Note, Position: record.Position, Tags: tags}, nil
}

func (r *ResolverForFavorite) CreateFavorite(ctx context.Context, input gqlmodel.InputFavorite) (*gqlmodel.Favorite, error) {
	owner, err := userID(ctx)
	if err != nil {
		return nil, err
	}
	record, err := favoriteInput(input)
	if err != nil {
		return nil, err
	}
	record.UserID = owner
	if err := r.DB.Create(&record).Error; err != nil {
		return nil, err
	}
	return toExternal(record)
}

func (r *ResolverForFavorite) UpdateFavorite(ctx context.Context, id int, input gqlmodel.InputFavorite) (*gqlmodel.Favorite, error) {
	owner, err := userID(ctx)
	if err != nil {
		return nil, err
	}
	record, err := favoriteInput(input)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{"title": record.Title, "note": record.Note, "tags_json": record.TagsJSON, "position": record.Position}
	changed := r.DB.Model(&model.Favorite{}).Where("id = ? AND user_id = ?", id, owner).Updates(updates)
	if changed.Error != nil {
		return nil, changed.Error
	}
	if changed.RowsAffected == 0 {
		return nil, errors.New("favorite not found")
	}
	record.ID, record.UserID = id, owner
	return toExternal(record)
}

func (r *ResolverForFavorite) RemoveFavorite(ctx context.Context, id int) (*gqlmodel.Favorite, error) {
	owner, err := userID(ctx)
	if err != nil {
		return nil, err
	}
	var record model.Favorite
	if err := r.DB.Where("id = ? AND user_id = ?", id, owner).First(&record).Error; err != nil {
		return nil, errors.New("favorite not found")
	}
	if err := r.DB.Where("id = ? AND user_id = ?", id, owner).Delete(&model.Favorite{}).Error; err != nil {
		return nil, err
	}
	return toExternal(record)
}
