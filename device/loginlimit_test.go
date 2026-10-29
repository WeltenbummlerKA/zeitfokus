package device

import (
	"testing"
	"time"
)

func TestLoginLimitCountsAliasesAndRecovers(t *testing.T) {
	saved := timeNow
	defer func() { timeNow = saved }()
	now := time.Date(2026, 10, 29, 12, 0, 0, 0, time.UTC)
	timeNow = func() time.Time { return now }
	r := &ResolverForDevice{}
	for i := 0; i < 10; i++ {
		if !r.allowLogin("user") {
			t.Fatal("early rejection")
		}
	}
	if r.allowLogin("user") {
		t.Fatal("unlimited attempts")
	}
	if !r.allowLogin("other") {
		t.Fatal("unrelated account blocked")
	}
	now = now.Add(15 * time.Minute)
	if !r.allowLogin("user") {
		t.Fatal("limit did not expire")
	}
}
