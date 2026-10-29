package entry_test

import (
	"github.com/traggo/server/dashboard"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
	"testing"
)

func TestSecurityForeignRangeIsRejected(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	db.User(2)
	r := dashboard.NewResolverForDashboard(db.DB)
	da, err := r.CreateDashboard(fake.User(1), "user A")
	if err != nil {
		t.Fatal(err)
	}
	dbb, err := r.CreateDashboard(fake.User(2), "user B")
	if err != nil {
		t.Fatal(err)
	}
	rb, err := r.AddDashboardRange(fake.User(2), dbb.ID, gqlmodel.InputNamedDateRange{Name: "B range", Editable: true, Range: &gqlmodel.InputRelativeOrStaticRange{From: "now-1d", To: "now"}})
	if err != nil {
		t.Fatal(err)
	}
	_, err = r.AddDashboardEntry(fake.User(1), da.ID, gqlmodel.EntryTypeBarChart, "synthetic A entry", false, gqlmodel.InputStatsSelection{Interval: gqlmodel.StatsIntervalDaily, Tags: []string{"project"}, RangeID: &rb.ID}, nil)
	if err == nil {
		t.Fatal("foreign range accepted")
	}
	if _, err = r.RemoveDashboardRange(fake.User(2), rb.ID); err != nil {
		t.Fatalf("owner cannot delete range: %v", err)
	}
}
