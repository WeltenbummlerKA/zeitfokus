package logger

import (
	"context"
	"github.com/99designs/gqlgen/graphql"
	"github.com/rs/zerolog/log"
	"time"
)

// GQLLog deliberately omits queries, variables and error strings: all can contain credentials.
func GQLLog() graphql.ResponseMiddleware {
	return func(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
		start := time.Now()
		result := next(ctx)
		count := len(graphql.GetErrors(ctx))
		if count > 0 {
			log.Error().Int("errors", count).Dur("took", time.Since(start)).Msg("GraphQL request failed")
		} else {
			log.Debug().Dur("took", time.Since(start)).Msg("GraphQL request completed")
		}
		return result
	}
}
