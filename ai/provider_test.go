package ai

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
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

func TestAnalyzeRejectsRedirects(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://127.0.0.1:1/public", http.StatusFound)
	}))
	defer server.Close()
	_, err := Analyze(context.Background(), ProviderConfig{Provider: "ollama", BaseURL: server.URL, Model: "qwen"}, Summary{})
	if err == nil || !strings.Contains(err.Error(), "redirect") {
		t.Fatalf("expected redirect rejection, got %v", err)
	}
}

func TestAnalyzeRejectsOversizedResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":{"content":"` + strings.Repeat("x", 1<<20) + `"}}`))
	}))
	defer server.Close()
	_, err := Analyze(context.Background(), ProviderConfig{Provider: "ollama", BaseURL: server.URL, Model: "qwen"}, Summary{})
	if err == nil || !strings.Contains(err.Error(), "1 MiB") {
		t.Fatalf("expected response-size rejection, got %v", err)
	}
}

func TestAnalyzeLMStudioAcceptsRootAndV1BaseURLs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/chat/completions" {
			t.Errorf("unexpected LM Studio path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"Report"}}]}`))
	}))
	defer server.Close()
	for _, suffix := range []string{"", "/", "/v1", "/v1/"} {
		got, err := Analyze(context.Background(), ProviderConfig{Provider: "lmstudio", BaseURL: server.URL + suffix, Model: "local"}, Summary{})
		if err != nil || got != "Report" {
			t.Fatalf("base suffix %q: got %q, err %v", suffix, got, err)
		}
	}
}
