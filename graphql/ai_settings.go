package graphql

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"time"

	"github.com/traggo/server/ai"
	"github.com/traggo/server/auth"
	"github.com/traggo/server/generated/gqlmodel"
	"github.com/traggo/server/model"
)

func (r *resolver) effectiveAIProvider() (ai.ProviderConfig, error) {
	var stored model.AISetting
	result := r.ResolverForSettings.DB.First(&stored, 1)
	if result.RecordNotFound() {
		return r.aiProvider, nil
	}
	if result.Error != nil {
		return ai.ProviderConfig{}, errors.New("AI settings could not be loaded")
	}
	return ai.ProviderConfig{Provider: stored.Provider, BaseURL: stored.BaseURL,
		Model: stored.Model, Timeout: time.Duration(stored.TimeoutSeconds) * time.Second}, nil
}

func externalAISettings(cfg ai.ProviderConfig) *gqlmodel.AISettings {
	provider := cfg.Provider
	if provider == "" {
		provider = "disabled"
	}
	timeout := int(cfg.Timeout / time.Second)
	if timeout <= 0 {
		timeout = 60
	}
	// Invalid legacy ENV values must not expose embedded credentials to the browser.
	endpoint := cfg.BaseURL
	parsed, err := url.Parse(endpoint)
	if err != nil || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		endpoint = ""
	}
	return &gqlmodel.AISettings{Provider: provider, BaseURL: endpoint, Model: cfg.Model, TimeoutSeconds: timeout}
}

func requireAIAdmin(ctx context.Context) error {
	user := auth.GetUser(ctx)
	if user == nil || !user.Admin {
		return errors.New("administrator access required")
	}
	return nil
}

func (r *resolver) AiSettings(ctx context.Context) (*gqlmodel.AISettings, error) {
	if err := requireAIAdmin(ctx); err != nil {
		return nil, err
	}
	cfg, err := r.effectiveAIProvider()
	if err != nil {
		return nil, err
	}
	return externalAISettings(cfg), nil
}

func (r *resolver) SetAISettings(ctx context.Context, input gqlmodel.InputAISettings) (*gqlmodel.AISettings, error) {
	if err := requireAIAdmin(ctx); err != nil {
		return nil, err
	}
	if input.TimeoutSeconds < 1 || input.TimeoutSeconds > 120 {
		return nil, errors.New("AI timeout must be between 1 and 120 seconds")
	}
	cfg := ai.ProviderConfig{Provider: strings.TrimSpace(input.Provider),
		BaseURL: strings.TrimRight(strings.TrimSpace(input.BaseURL), "/"),
		Model: strings.TrimSpace(input.Model), Timeout: time.Duration(input.TimeoutSeconds) * time.Second}
	if cfg.Provider != "disabled" && cfg.Provider != "ollama" && cfg.Provider != "lmstudio" {
		return nil, errors.New("unsupported AI provider")
	}
	if len(cfg.BaseURL) > 2048 || len(cfg.Model) > 256 {
		return nil, errors.New("AI endpoint or model name is too long")
	}
	// Deactivating also removes endpoint details; no arbitrary URLs or credentials
	// can be retained in an inactive configuration.
	if cfg.Provider == "disabled" {
		cfg.BaseURL, cfg.Model = "", ""
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	stored := model.AISetting{ID: 1, Provider: cfg.Provider, BaseURL: cfg.BaseURL,
		Model: cfg.Model, TimeoutSeconds: input.TimeoutSeconds}
	if err := r.ResolverForSettings.DB.Save(&stored).Error; err != nil {
		return nil, errors.New("AI settings could not be saved")
	}
	return externalAISettings(cfg), nil
}
