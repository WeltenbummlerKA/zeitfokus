package model

// Favorite is a private time-entry template belonging to exactly one user.
type Favorite struct {
	ID       int `gorm:"primary_key;AUTO_INCREMENT"`
	UserID   int `gorm:"index;type:int REFERENCES users(id) ON DELETE CASCADE"`
	Title    string
	Note     string
	TagsJSON string `gorm:"type:text"`
	Position int
}
