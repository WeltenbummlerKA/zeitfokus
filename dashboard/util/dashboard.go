package util

import (
	"errors"

	"github.com/jinzhu/gorm"
	"github.com/traggo/server/model"
)

// FindDashboard finds a dashboard.
func FindDashboard(db *gorm.DB, userID, dashboardID int) (model.Dashboard, error) {
	dashboard := model.Dashboard{}
	find := db.Where(&model.Dashboard{UserID: userID, ID: dashboardID}).Find(&dashboard)
	if find.RecordNotFound() {
		return dashboard, errors.New("dashboard does not exist")
	}

	return dashboard, find.Error
}

// FindDashboardRange finds a dashboard range.
func FindDashboardRange(db *gorm.DB, rangeID int) (model.DashboardRange, error) {
	dashboardRange := model.DashboardRange{}
	find := db.Where(&model.DashboardRange{ID: rangeID}).Find(&dashboardRange)
	if find.RecordNotFound() {
		return dashboardRange, errors.New("dashboard range does not exist")
	}

	return dashboardRange, find.Error
}

// FindDashboardEntry finds a dashboard entry.
func FindDashboardEntry(db *gorm.DB, entryID int) (model.DashboardEntry, error) {
	dashboardEntry := model.DashboardEntry{}
	find := db.Where(&model.DashboardEntry{ID: entryID}).Find(&dashboardEntry)
	if find.RecordNotFound() {
		return dashboardEntry, errors.New("entry does not exist")
	}

	return dashboardEntry, find.Error
}

// FindOwnedDashboardRange prevents references to another user's or dashboard's range.
func FindOwnedDashboardRange(db *gorm.DB, userID, dashboardID, rangeID int) (model.DashboardRange, error) {
	value, err := FindDashboardRange(db, rangeID)
	if err != nil {
		return value, err
	}
	if value.DashboardID != dashboardID {
		return model.DashboardRange{}, errors.New("dashboard range does not exist")
	}
	if _, err := FindDashboard(db, userID, value.DashboardID); err != nil {
		return model.DashboardRange{}, err
	}
	return value, nil
}
