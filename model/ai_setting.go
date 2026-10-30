package model

// AISetting stores the administrator's instance-wide provider selection.
// It contains no credentials and shares the existing application database.
type AISetting struct {
	ID int `gorm:"primary_key"`
	Provider string
	BaseURL string
	Model string
	TimeoutSeconds int
}
