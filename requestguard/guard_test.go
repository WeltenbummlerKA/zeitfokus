package requestguard

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestOriginAndBodyLimits(t *testing.T) {
	for _, tc := range []struct {
		name, origin, fetch string
		size                int
		status              int
	}{
		{name: "native", status: 204}, {name: "same origin", origin: "http://traggo.test:3030", status: 204},
		{name: "same site different origin", origin: "http://evil.traggo.test:3030", status: 403},
		{name: "opaque", origin: "null", status: 403}, {name: "cross site", fetch: "cross-site", status: 403},
		{name: "large", size: MaxBodyBytes + 1, status: 413},
	} {
		t.Run(tc.name, func(t *testing.T) {
			h := Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }))
			req := httptest.NewRequest("POST", "http://traggo.test:3030/graphql", strings.NewReader(strings.Repeat("x", tc.size)))
			req.Header.Set("Origin", tc.origin)
			req.Header.Set("Sec-Fetch-Site", tc.fetch)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			if rec.Code != tc.status {
				t.Fatalf("got %d want %d", rec.Code, tc.status)
			}
		})
	}
}

func TestChunkedBodyIsBounded(t *testing.T) {
	h := Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := io.ReadAll(r.Body); err == nil {
			t.Error("unbounded body")
		}
	}))
	req := httptest.NewRequest("POST", "/graphql", strings.NewReader(strings.Repeat("x", MaxBodyBytes+1)))
	req.ContentLength = -1
	h.ServeHTTP(httptest.NewRecorder(), req)
}

func TestRateLimitDoesNotTrustForwardingHeaders(t *testing.T) {
	h := Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }))
	for i := 0; i < 121; i++ {
		req := httptest.NewRequest("POST", "/graphql", nil)
		req.Header.Set("X-Forwarded-For", strings.Repeat("x", i))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if i == 120 && rec.Code != 429 {
			t.Fatal("rate limit bypassed")
		}
	}
}
