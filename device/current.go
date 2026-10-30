package device

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
)

// CurrentDevice returns the current device.
func (r *ResolverForDevice) CurrentDevice(ctx context.Context) (*gqlmodel.Device, error) {
	device := auth.GetDevice(ctx)
	if device == nil {
		return nil, nil
	}
	var result gqlmodel.Device
	if err := copier.Copy(&result, device); err != nil { return nil, err }
	return &result, nil
}
