package ai

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProviderRejectsPublicEndpoints(t *testing.T) {
	if err := (ProviderConfig{Provider: "ollama", BaseURL: "https://example.com", Model: "x"}).Validate(); err == nil {
		t.Fatal("public endpoint accepted")
	}
}

func TestAnalyzeOllamaUsesAggregatePayload(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/chat" {
			t.Fatalf("path %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":{"content":"Zusammenfassung"}}`))
	}))
	defer server.Close()
	// httptest uses 127.0.0.1, which is explicitly permitted for local Ollama.
	got, err := Analyze(context.Background(), ProviderConfig{Provider: "ollama", BaseURL: server.URL, Model: "qwen"}, Summary{CompletedEntries: 2, TotalSeconds: 120, TagSeconds: map[string]int64{"projekt=x": 120}})
	if err != nil || got != "Zusammenfassung" {
		t.Fatalf("got %q, err %v", got, err)
	}
}
