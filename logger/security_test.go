package logger

import (
	"bytes"
	"context"
	"github.com/99designs/gqlgen/graphql"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"strings"
	"testing"
)

func TestGraphQLLogsDoNotContainSecrets(t *testing.T) {
	var b bytes.Buffer
	old := log.Logger
	defer func() { log.Logger = old }()
	log.Logger = zerolog.New(&b)
	ctx := graphql.WithResponseContext(context.Background(), graphql.DefaultErrorPresenter, graphql.DefaultRecover)
	ctx = graphql.WithOperationContext(ctx, &graphql.OperationContext{RawQuery: `mutation {login(pass: """synthetic-secret""")}`})
	GQLLog()(ctx, func(ctx context.Context) *graphql.Response {
		graphql.AddErrorf(ctx, "synthetic-secret")
		return &graphql.Response{}
	})
	if strings.Contains(b.String(), "synthetic-secret") {
		t.Fatal("secret logged")
	}
	if !strings.Contains(b.String(), "GraphQL request failed") {
		t.Fatal("missing safe diagnostic")
	}
}
