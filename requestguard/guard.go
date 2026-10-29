// Package requestguard bounds unauthenticated requests before parsing or database access.
package requestguard

import (
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const MaxBodyBytes = 1 << 20

type bucket struct {
	start time.Time
	count int
}

// Wrap uses the socket peer, never untrusted forwarding headers. Behind a proxy the
// quota is shared; configure its own limits and network ACLs as an additional layer.
func Wrap(next http.Handler) http.Handler {
	var mu sync.Mutex
	peers := map[string]bucket{}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		if !sameOrigin(r) {
			http.Error(w, "origin not allowed", http.StatusForbidden)
			return
		}
		if r.ContentLength > MaxBodyBytes {
			http.Error(w, "request too large", http.StatusRequestEntityTooLarge)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)
		peer, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			peer = r.RemoteAddr
		}
		now := time.Now()
		mu.Lock()
		b, exists := peers[peer]
		if !exists || now.Sub(b.start) >= time.Minute {
			for key, v := range peers {
				if now.Sub(v.start) >= time.Minute {
					delete(peers, key)
				}
			}
			if len(peers) >= 4096 {
				mu.Unlock()
				http.Error(w, "request limit reached", http.StatusTooManyRequests)
				return
			}
			b = bucket{start: now}
		}
		b.count++
		peers[peer] = b
		mu.Unlock()
		if b.count > 120 {
			w.Header().Set("Retry-After", "60")
			http.Error(w, "request limit reached", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func sameOrigin(r *http.Request) bool {
	if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		return false
	}
	raw := r.Header.Get("Origin")
	if raw == "" {
		return true
	} // Native clients do not set a browser Origin.
	origin, err := url.Parse(raw)
	return err == nil && (origin.Scheme == "http" || origin.Scheme == "https") && origin.User == nil && origin.Path == "" && origin.RawQuery == "" && origin.Fragment == "" && strings.EqualFold(origin.Host, r.Host)
}
