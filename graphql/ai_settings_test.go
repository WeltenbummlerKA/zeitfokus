package graphql

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"sync/atomic"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/traggo/server/ai"
	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
)

func TestAISettingsAuthorizationPersistenceAndAnalysis(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	var requests atomic.Int32
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		requests.Add(1)
		require.Equal(t, "/v1/chat/completions", req.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"Report"}}]}`))
	}))
	defer backend.Close()
	fallback := ai.ProviderConfig{Provider: "ollama", BaseURL: "http://127.0.0.1:11434", Model: "fallback", Timeout: time.Minute}
	handler := Handler("/graphql", NewResolver(db.DB, 4, model.Version{}, fallback), NewDirective())
	execute := func(ctx context.Context, query string, variables map[string]interface{}) map[string]interface{} {
		body, err := json.Marshal(map[string]interface{}{"query": query, "variables": variables})
		require.NoError(t, err)
		req := httptest.NewRequest("POST", "http://test.local/graphql", bytes.NewReader(body)).WithContext(ctx)
		req.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, req)
		var result map[string]interface{}
		require.NoError(t, json.Unmarshal(response.Body.Bytes(), &result))
		return result
	}
	query := `{aiSettings{provider baseURL model timeoutSeconds}}`
	mutation := `mutation($settings:InputAISettings!){setAISettings(settings:$settings){provider baseURL model timeoutSeconds}}`
	input := map[string]interface{}{"settings": map[string]interface{}{
		"provider": "lmstudio", "baseURL": backend.URL + "/v1", "model": "local-model", "timeoutSeconds": 60,
	}}
	for _, ctx := range []context.Context{context.Background(), fake.UserWithPerm(1, false)} {
		require.NotEmpty(t, execute(ctx, query, nil)["errors"])
		require.NotEmpty(t, execute(ctx, mutation, input)["errors"])
	}
	initial := execute(fake.User(1), query, nil)
	require.Empty(t, initial["errors"])
	require.Equal(t, "ollama", initial["data"].(map[string]interface{})["aiSettings"].(map[string]interface{})["provider"])
	require.Empty(t, execute(fake.User(1), mutation, input)["errors"])
	require.Equal(t, int32(0), requests.Load(), "saving must not send time data to the model")
	// Recreating the resolver must preserve the database choice over the ENV fallback.
	handler = Handler("/graphql", NewResolver(db.DB, 4, model.Version{}, fallback), NewDirective())
	loaded := execute(fake.User(1), query, nil)
	require.Empty(t, loaded["errors"])
	require.Equal(t, "lmstudio", loaded["data"].(map[string]interface{})["aiSettings"].(map[string]interface{})["provider"])
	analysis := execute(fake.User(1), `mutation{analyzeTimeReport(input:{from:"2026-10-01T00:00:00Z",toExclusive:"2026-10-02T00:00:00Z"}){text}}`, nil)
	require.Empty(t, analysis["errors"])
	require.Equal(t, int32(1), requests.Load())
	for _, invalid := range []map[string]interface{}{
		{"provider": "unknown", "baseURL": backend.URL, "model": "x", "timeoutSeconds": 60},
		{"provider": "ollama", "baseURL": "http://8.8.8.8", "model": "x", "timeoutSeconds": 60},
		{"provider": "ollama", "baseURL": "http://user:secret@127.0.0.1", "model": "x", "timeoutSeconds": 60},
		{"provider": "ollama", "baseURL": backend.URL, "model": "", "timeoutSeconds": 60},
		{"provider": "ollama", "baseURL": backend.URL, "model": "x", "timeoutSeconds": 0},
	} {
		require.NotEmpty(t, execute(fake.User(1), mutation, map[string]interface{}{"settings": invalid})["errors"])
	}
	unchanged := execute(fake.User(1), query, nil)
	require.Equal(t, loaded["data"], unchanged["data"])
	disabled := map[string]interface{}{"settings": map[string]interface{}{"provider": "disabled", "baseURL": "", "model": "", "timeoutSeconds": 60}}
	require.Empty(t, execute(fake.User(1), mutation, disabled)["errors"])
	require.NotEmpty(t, execute(fake.User(1), `mutation{analyzeTimeReport(input:{from:"2026-10-01T00:00:00Z",toExclusive:"2026-10-02T00:00:00Z"}){text}}`, nil)["errors"])
	require.Equal(t, int32(1), requests.Load())
}
