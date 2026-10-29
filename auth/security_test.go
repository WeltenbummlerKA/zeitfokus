package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
)

// These tests document the observed vulnerable behavior, not the desired fix.
func TestSecurityExpiredTokenIsRejected(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	u := db.User(1)
	old := time.Now().Add(-48 * time.Hour)
	d := model.Device{Token: "synthetic-review-token", UserID: u.User.ID, Type: model.TypeShortExpiry, ActiveAt: old, CreatedAt: old}
	if err := db.Create(&d).Error; err != nil {
		t.Fatal(err)
	}
	accepted := false
	h := Middleware(db.DB)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { accepted = GetUser(r.Context()) != nil }))
	req := httptest.NewRequest("POST", "/graphql", nil)
	req.Header.Set("Authorization", "traggo synthetic-review-token")
	h.ServeHTTP(httptest.NewRecorder(), req)
	if accepted {
		t.Fatal("expired token was accepted")
	}
	var stored model.Device
	if err := db.First(&stored, d.ID).Error; err != nil {
		t.Fatal(err)
	}
	if !stored.ActiveAt.Equal(old) {
		t.Fatal("expired activity was renewed")
	}
	t.Log("Expired token is rejected without renewal")
}

func TestSecurityCookieFlags(t *testing.T) {
	for _, secure := range []bool{false, true} {
		rec := httptest.NewRecorder()
		req := sessionCallbacks(httptest.NewRequest("POST", "/graphql", nil), rec, secure)
		GetCreateSession(req.Context())("synthetic-review-token", 3600)
		c := rec.Result().Cookies()[0]
		if !c.HttpOnly || c.Secure != secure || c.SameSite != http.SameSiteLaxMode || c.Path != "/" {
			t.Fatalf("unexpected cookie: %#v", c)
		}
	}
}

func TestSecurityCookieRenewalKeepsFlags(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	u := db.User(1)
	u.NewDevice(1, "synthetic-review-token", "test")
	h := Middleware(db.DB, true)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	req := httptest.NewRequest("POST", "/graphql", nil)
	req.Header.Set("Cookie", "traggo=synthetic-review-token")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	c := rec.Result().Cookies()[0]
	if !c.HttpOnly || !c.Secure || c.SameSite != http.SameSiteLaxMode || c.Path != "/" {
		t.Fatalf("renewed cookie lost flags: %#v", c)
	}
}
