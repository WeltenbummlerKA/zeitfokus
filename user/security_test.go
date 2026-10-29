package user

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/traggo/server/auth"
	"github.com/traggo/server/test"
	"github.com/traggo/server/user/password"
)

func TestSecurityPasswordChangeRevokesSession(t *testing.T) {
	saved := createPassword
	createPassword = password.CreatePassword
	defer func() { createPassword = saved }()
	db := test.InMemoryDB(t)
	defer db.Close()
	u := db.User(1)
	u.NewDevice(1, "synthetic-review-token", "test device")
	r := ResolverForUser{DB: db.DB, PassStrength: 4}
	pw := "synthetic-review-password"
	if _, err := r.UpdateUser(context.Background(), 1, u.User.Name, &pw, false); err != nil {
		t.Fatal(err)
	}
	accepted := false
	h := auth.Middleware(db.DB)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { accepted = auth.GetUser(r.Context()) != nil }))
	req := httptest.NewRequest("POST", "/graphql", nil)
	req.Header.Set("Authorization", "traggo synthetic-review-token")
	h.ServeHTTP(httptest.NewRecorder(), req)
	if accepted {
		t.Fatal("token survives password change")
	}
	t.Log("Old token rejected after password change")
}
