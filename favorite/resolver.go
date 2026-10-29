package favorite

import "github.com/jinzhu/gorm"

// ResolverForFavorite implements authenticated private entry templates.
type ResolverForFavorite struct{ DB *gorm.DB }
