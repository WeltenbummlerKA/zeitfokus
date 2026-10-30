package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// ProviderConfig is server-side configuration, editable only by administrators.
// Credentials are not supported; requests are restricted to local/private hosts.
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
	if _, err := resolvePrivateIPs(context.Background(), u.Hostname()); err != nil {
		return errors.New("AI endpoint must resolve to a private or local network address")
	}
	return nil
}

func privateHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && privateIP(ip)
}

func privateIP(ip net.IP) bool {
	return !ip.IsUnspecified() && !ip.IsMulticast() &&
		(ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast())
}

// resolvePrivateIPs resolves a configured hostname and rejects public answers.
// The same check is repeated by the transport immediately before dialing to
// prevent DNS rebinding between configuration validation and the request.
func resolvePrivateIPs(ctx context.Context, host string) ([]net.IP, error) {
	if ip := net.ParseIP(host); ip != nil {
		if privateIP(ip) {
			return []net.IP{ip}, nil
		}
		return nil, errors.New("AI endpoint resolved to a public or unsafe address")
	}
	if strings.EqualFold(host, "localhost") {
		return []net.IP{net.IPv4(127, 0, 0, 1)}, nil
	}
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
	if err != nil || len(ips) == 0 {
		return nil, errors.New("AI endpoint hostname could not be resolved")
	}
	for _, ip := range ips {
		if !privateIP(ip) {
			return nil, errors.New("AI endpoint resolved to a public or unsafe address")
		}
	}
	return ips, nil
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
		base := strings.TrimSuffix(strings.TrimRight(cfg.BaseURL, "/"), "/v1")
		endpoint = base + "/v1/chat/completions"
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
	transport := http.DefaultTransport.(*http.Transport).Clone()
	// Do not allow environment proxies to bypass the private-address policy.
	transport.Proxy = nil
	transport.DialContext = func(dialCtx context.Context, network, address string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		ips, err := resolvePrivateIPs(dialCtx, host)
		if err != nil {
			return nil, err
		}
		dialer := &net.Dialer{}
		var lastErr error
		for _, ip := range ips {
			conn, dialErr := dialer.DialContext(dialCtx, network, net.JoinHostPort(ip.String(), port))
			if dialErr == nil {
				return conn, nil
			}
			lastErr = dialErr
		}
		return nil, lastErr
	}
	client := &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return errors.New("AI provider redirects are not allowed")
		},
	}
	defer transport.CloseIdleConnections()
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("AI provider unavailable: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("AI provider returned HTTP %d", resp.StatusCode)
	}
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20+1))
	if err != nil {
		return "", err
	}
	if len(responseBody) > 1<<20 {
		return "", errors.New("AI provider response exceeds 1 MiB")
	}
	if kind == "ollama" {
		var out ollamaResponse
		if err := json.Unmarshal(responseBody, &out); err != nil {
			return "", err
		}
		if out.Error != "" {
			return "", errors.New(out.Error)
		}
		return out.Message.Content, nil
	}
	var out openAIResponse
	if err := json.Unmarshal(responseBody, &out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", errors.New("AI provider returned no completion")
	}
	return out.Choices[0].Message.Content, nil
}
