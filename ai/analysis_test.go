package ai

import (
	"testing"
	"time"

	"github.com/traggo/server/model"
)

func TestSummarizeExcludesOpenAndInvalidSpans(t *testing.T) {
	a := time.Date(2026, 3, 29, 0, 30, 0, 0, time.UTC)
	b := a.Add(90 * time.Minute)
	end := b
	s := Summarize([]model.TimeSpan{
		{StartUTC: a, EndUTC: &end, Tags: []model.TimeSpanTag{{Key: "project", StringValue: "A"}}},
		{StartUTC: b},
		{StartUTC: b, EndUTC: func() *time.Time { x := b.Add(-time.Minute); return &x }()},
	}, time.UTC)
	if s.CompletedEntries != 1 || s.TotalSeconds != 5400 || s.DaysWithActivity != 1 {
		t.Fatalf("unexpected summary: %+v", s)
	}
	if s.TagSeconds["project=A"] != 5400 {
		t.Fatalf("tag total missing: %+v", s.TagSeconds)
	}
}

func TestSummarizeUsesProvidedLocationForDayCount(t *testing.T) {
	loc, _ := time.LoadLocation("Europe/Berlin")
	a := time.Date(2026, 1, 1, 23, 30, 0, 0, time.UTC)
	b := a.Add(time.Hour)
	s := Summarize([]model.TimeSpan{{StartUTC: a, EndUTC: &b}}, loc)
	if s.DaysWithActivity != 1 || s.From.Location() != loc {
		t.Fatalf("unexpected local summary: %+v", s)
	}
}
