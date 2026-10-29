package graphql

import (
	"bytes"
	"mime/multipart"
	"net/http/httptest"
	"testing"

	"github.com/traggo/server/auth"
	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
)

func TestSecurityCrossOriginMultipartMutationRejected(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	u := db.User(1)
	u.NewDevice(1, "synthetic-review-token", "test")
	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	mw.WriteField("operations", `{"query":"mutation {createDashboard(name: \"synthetic multipart\") {id name}}"}`)
	mw.WriteField("map", `{}`)
	mw.Close()
	req := httptest.NewRequest("POST", "https://traggo.example.test/graphql", &b)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Origin", "https://untrusted.example.test")
	req.Header.Set("Cookie", "traggo=synthetic-review-token")
	rec := httptest.NewRecorder()
	h := auth.Middleware(db.DB)(Handler("/graphql", NewResolver(db.DB, 4, model.Version{}), NewDirective()))
	h.ServeHTTP(rec, req)
	if rec.Code != 403 {
		t.Fatalf("foreign origin accepted: %d %s", rec.Code, rec.Body.String())
	}
}
