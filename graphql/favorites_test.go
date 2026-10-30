package graphql

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/traggo/server/model"
	"github.com/traggo/server/test"
	"github.com/traggo/server/test/fake"
)

func TestFavoriteGraphQLAuthAndExistingQueriesRemainCompatible(t *testing.T) {
	db := test.InMemoryDB(t)
	defer db.Close()
	db.User(1)
	handler := Handler("/graphql", NewResolver(db.DB, 4, model.Version{}), NewDirective())
	execute := func(ctx context.Context, query string) map[string]interface{} {
		body, err := json.Marshal(map[string]interface{}{"query": query})
		require.NoError(t, err)
		request := httptest.NewRequest("POST", "http://test.local/graphql", bytes.NewReader(body)).WithContext(ctx)
		request.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		var result map[string]interface{}
		require.NoError(t, json.Unmarshal(response.Body.Bytes(), &result))
		return result
	}
	for _, query := range []string{
		"{favorites{id title}}",
		`mutation{createFavorite(input:{title:"Private",note:"",position:0}){id}}`,
		`mutation{updateFavorite(id:1,input:{title:"Private",note:"",position:0}){id}}`,
		`mutation{removeFavorite(id:1){id}}`,
	} {
		require.NotEmpty(t, execute(context.Background(), query)["errors"])
	}
	created := execute(fake.User(1), `mutation{createFavorite(input:{title:"Private",note:"Template",position:0}){id title}}`)
	require.Empty(t, created["errors"])
	// An existing client query can continue selecting the original fields only.
	legacy := execute(fake.User(1), "{userSettings{theme dateLocale firstDayOfTheWeek dateTimeInputStyle} timers{id start note}}")
	require.Empty(t, legacy["errors"])
	require.NotNil(t, legacy["data"])
}
