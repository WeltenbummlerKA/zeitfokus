package graphql

import (
	"github.com/traggo/server/requestguard"
	"mime"
	"net/http"
	"strings"

	"github.com/99designs/gqlgen/handler"
	"github.com/traggo/server/generated/gqlschema"
	"github.com/traggo/server/logger"
)

// Handler combines graphql handler and playground handler.
func Handler(endpoint string, resolvers gqlschema.ResolverRoot, directives gqlschema.DirectiveRoot, middleware ...func(http.Handler) http.Handler) http.HandlerFunc {
	gqlHandler := handler.GraphQL(gqlschema.NewExecutableSchema(gqlschema.Config{
		Resolvers:  resolvers,
		Directives: directives,
	}), handler.RequestMiddleware(logger.GQLLog()), handler.ComplexityLimit(200))
	playground := handler.Playground("Traggo Playground", endpoint)

	var inner http.Handler = http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Upgrade") != "" {
			http.Error(writer, "transport not supported", http.StatusBadRequest)
			return
		}
		if request.Method == http.MethodPost {
			kind, _, err := mime.ParseMediaType(request.Header.Get("Content-Type"))
			if err != nil || kind != "application/json" {
				http.Error(writer, "application/json required", http.StatusUnsupportedMediaType)
				return
			}
		}
		if acceptHTMLAndNotJSON(request) {
			playground.ServeHTTP(writer, request)
		} else {
			gqlHandler.ServeHTTP(writer, request)
		}
	})
	for i := len(middleware) - 1; i >= 0; i-- {
		inner = middleware[i](inner)
	}
	return requestguard.Wrap(inner).ServeHTTP
}

func acceptHTMLAndNotJSON(request *http.Request) bool {
	val := request.Header.Get("Accept")
	return strings.Contains(val, "text/html") && !strings.Contains(val, "application/json")
}
