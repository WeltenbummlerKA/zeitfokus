package user

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
)

// Users returns all users.
func (r *ResolverForUser) Users(ctx context.Context) ([]*gqlmodel.User, error) {
	var users []model.User
	find := r.DB.Find(&users)
	var result []*gqlmodel.User
	if err := copier.Copy(&result, &users); err != nil { return nil, err }
	return result, find.Error
}
