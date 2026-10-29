package device

import (
	"github.com/jinzhu/gorm"
	"sync"
)

// ResolverForDevice resolves device specific things.
type ResolverForDevice struct {
	DB            *gorm.DB
	loginMu       sync.Mutex
	loginAttempts map[string]loginAttempt
}
