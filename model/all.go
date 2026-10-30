package model

// All returns all schema instances.
func All() []interface{} {
	return []interface{}{
		new(TagDefinition),
		new(User),
		new(Device),
		new(TimeSpan),
		new(TimeSpanTag),
		new(UserSetting),
		new(AISetting),
		new(Favorite),
		new(Dashboard),
		new(DashboardEntry),
		new(DashboardTagFilter),
		new(DashboardRange),
	}
}
