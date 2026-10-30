package user

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
)

// CurrentUser returns the current user.
func (r *ResolverForUser) CurrentUser(ctx context.Context) (*gqlmodel.User, error) {
	user := auth.GetUser(ctx)
	if user == nil {
		return nil, nil
	}
	var result gqlmodel.User
	if err := copier.Copy(&result, user); err != nil { return nil, err }
	return &result, nil
}
