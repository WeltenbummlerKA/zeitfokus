// Package ai contains the privacy-preserving building blocks for optional
// assisted time-report analysis. It deliberately keeps the deterministic
// aggregation separate from any model provider.
package ai

import (
	"sort"
	"time"

	"github.com/traggo/server/model"
)

// Summary is safe to pass to a model: it contains aggregate metrics only.
// Notes/descriptions are never included by Summarize.
type Summary struct {
	From             time.Time
	To               time.Time
	CompletedEntries int
	TotalSeconds     int64
	AverageSeconds   int64
	DaysWithActivity int
	TagSeconds       map[string]int64
}

// Summarize computes complete, user-filtered metrics without contacting a
// model or exposing notes. Open spans are intentionally excluded.
func Summarize(spans []model.TimeSpan, loc *time.Location) Summary {
	if loc == nil {
		loc = time.UTC
	}
	result := Summary{TagSeconds: map[string]int64{}}
	days := map[string]struct{}{}
	for _, span := range spans {
		if span.EndUTC == nil {
			continue
		}
		start, end := span.StartUTC, *span.EndUTC
		if !end.After(start) {
			continue
		}
		seconds := int64(end.Sub(start) / time.Second)
		result.TotalSeconds += seconds
		result.CompletedEntries++
		local := start.In(loc)
		days[local.Format("2006-01-02")] = struct{}{}
		for _, tag := range span.Tags {
			key := tag.Key
			if tag.StringValue != "" {
				key += "=" + tag.StringValue
			}
			result.TagSeconds[key] += seconds
		}
	}
	result.DaysWithActivity = len(days)
	if result.CompletedEntries > 0 {
		result.AverageSeconds = result.TotalSeconds / int64(result.CompletedEntries)
	}
	if len(spans) > 0 {
		copySpans := append([]model.TimeSpan(nil), spans...)
		sort.Slice(copySpans, func(i, j int) bool { return copySpans[i].StartUTC.Before(copySpans[j].StartUTC) })
		result.From = copySpans[0].StartUTC.In(loc)
		for i := len(copySpans) - 1; i >= 0; i-- {
			if copySpans[i].EndUTC != nil {
				result.To = copySpans[i].EndUTC.In(loc)
				break
			}
		}
	}
	return result
}
