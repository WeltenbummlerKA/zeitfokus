package user

import (
	"context"
	"fmt"

	"github.com/jinzhu/copier"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
)

// UpdateUser updates a user.
func (r *ResolverForUser) UpdateUser(ctx context.Context, id int, name string, pass *string, admin bool) (*gqlmodel.User, error) {
	user := new(model.User)
	if r.DB.Find(user, id).RecordNotFound() {
		return nil, fmt.Errorf("user with id %d does not exist", id)
	}

	user.Name = name
	user.Admin = admin

	if pass != nil {
		user.Pass = createPassword(*pass, r.PassStrength)
	}

	tx := r.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer tx.Rollback()
	if err := tx.Save(user).Error; err != nil {
		return nil, err
	}
	if pass != nil {
		if err := tx.Where("user_id = ?", id).Delete(new(model.Device)).Error; err != nil {
			return nil, err
		}
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	gqlUser := &gqlmodel.User{}
	copier.Copy(gqlUser, user)
	return gqlUser, nil
}
