package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// ProviderConfig is deliberately server-side configuration. It is never
// serialized into the browser or accepted from a user request.
type ProviderConfig struct {
	Provider string // disabled, ollama, or lmstudio
	BaseURL  string
	Model    string
	Timeout  time.Duration
}

func (c ProviderConfig) Validate() error {
	if c.Provider == "disabled" || c.Provider == "" {
		return nil
	}
	if c.Provider != "ollama" && c.Provider != "lmstudio" {
		return errors.New("unsupported AI provider")
	}
	if c.Model == "" {
		return errors.New("AI model is required")
	}
	u, err := url.Parse(c.BaseURL)
	if err != nil || u.Scheme != "http" || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		return errors.New("AI endpoint must be an http URL without credentials or query parameters")
	}
	if !privateHost(u.Hostname()) {
		return errors.New("AI endpoint must resolve to a private or local network address")
	}
	return nil
}

func privateHost(host string) bool {
	if host == "localhost" || strings.HasSuffix(host, ".local") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && (ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast())
}

type ollamaRequest struct {
	Model    string    `json:"model"`
	Messages []message `json:"messages"`
	Stream   bool      `json:"stream"`
}
type openAIRequest struct {
	Model    string    `json:"model"`
	Messages []message `json:"messages"`
	Stream   bool      `json:"stream"`
}
type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
type ollamaResponse struct {
	Message message `json:"message"`
	Error   string  `json:"error"`
}
type openAIResponse struct {
	Choices []struct {
		Message message `json:"message"`
	} `json:"choices"`
	Error json.RawMessage `json:"error"`
}

// Analyze sends aggregate metrics only. Descriptions are intentionally not
// part of Summary and therefore cannot leave the backend accidentally.
func Analyze(ctx context.Context, cfg ProviderConfig, summary Summary) (string, error) {
	if err := cfg.Validate(); err != nil {
		return "", err
	}
	if cfg.Provider == "" || cfg.Provider == "disabled" {
		return "", errors.New("AI analysis is disabled")
	}
	payload := fmt.Sprintf("Zeitraum %s bis %s; abgeschlossene Einträge: %d; Gesamtsekunden: %d; Durchschnittssekunden: %d; aktive Tage: %d; Tagsekunden: %v. Fasse die Arbeitszeit sachlich zusammen. Erfinde keine Ursachen oder Empfehlungen.", summary.From.Format(time.RFC3339), summary.To.Format(time.RFC3339), summary.CompletedEntries, summary.TotalSeconds, summary.AverageSeconds, summary.DaysWithActivity, summary.TagSeconds)
	msg := []message{{Role: "user", Content: payload}}
	var body []byte
	var endpoint string
	var kind string
	if cfg.Provider == "ollama" {
		body, _ = json.Marshal(ollamaRequest{cfg.Model, msg, false})
		endpoint = strings.TrimRight(cfg.BaseURL, "/") + "/api/chat"
		kind = "ollama"
	} else {
		body, _ = json.Marshal(openAIRequest{cfg.Model, msg, false})
		endpoint = strings.TrimRight(cfg.BaseURL, "/") + "/v1/chat/completions"
		kind = "openai"
	}
	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	requestCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	req, err := http.NewRequestWithContext(requestCtx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{Timeout: timeout}).Do(req)
	if err != nil {
		return "", fmt.Errorf("AI provider unavailable: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("AI provider returned HTTP %d", resp.StatusCode)
	}
	if kind == "ollama" {
		var out ollamaResponse
		if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
			return "", err
		}
		if out.Error != "" {
			return "", errors.New(out.Error)
		}
		return out.Message.Content, nil
	}
	var out openAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", errors.New("AI provider returned no completion")
	}
	return out.Choices[0].Message.Content, nil
}
