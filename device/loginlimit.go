package device

import "time"

type loginAttempt struct {
	start time.Time
	count int
}

// Reserve before bcrypt, also for aliases within a single GraphQL mutation.
func (r *ResolverForDevice) allowLogin(username string) bool {
	r.loginMu.Lock()
	defer r.loginMu.Unlock()
	if len(username) > 256 {
		return false
	}
	if r.loginAttempts == nil {
		r.loginAttempts = map[string]loginAttempt{}
	}
	now := timeNow()
	a, exists := r.loginAttempts[username]
	if !exists || now.Sub(a.start) >= 15*time.Minute {
		for k, v := range r.loginAttempts {
			if now.Sub(v.start) >= 15*time.Minute {
				delete(r.loginAttempts, k)
			}
		}
		if len(r.loginAttempts) >= 4096 {
			return false
		}
		a = loginAttempt{start: now}
	}
	a.count++
	r.loginAttempts[username] = a
	return a.count <= 10
}
