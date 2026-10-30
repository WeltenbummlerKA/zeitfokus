package main

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"
)

type Favorite struct {
	ID       string `json:"id"`
	Titel    string `json:"titel"`
	Position int    `json:"position"`
}

type Payload struct {
	UpdatedAt float64    `json:"updatedAt"`
	Favorites []Favorite `json:"favorites"`
}

type FavoriteServer struct {
	mu                   sync.Mutex
	storePath            string
	token                string
	allowUnauthenticated bool
	store                map[string]Payload
}

func main() {
	favorites := &FavoriteServer{
		// Keep the legacy image mount as the fallback; renamed stacks set the
		// ZEITFOKUS_FAVORITES_STORE path explicitly.
		storePath:            envCompat("ZEITFOKUS_FAVORITES_STORE", "TRAGGO_FAVORITES_STORE", "/opt/zeitfokus/data/favorites.json"),
		token:                envCompat("ZEITFOKUS_FAVORITES_TOKEN", "TRAGGO_FAVORITES_TOKEN", ""),
		allowUnauthenticated: envBoolCompat("ZEITFOKUS_FAVORITES_ALLOW_UNAUTHENTICATED", "TRAGGO_FAVORITES_ALLOW_UNAUTHENTICATED", false),
		store:                map[string]Payload{},
	}

	if favorites.token == "" && favorites.allowUnauthenticated {
		log.Printf("warning: favorites sync is running without bearer-token protection")
	}

	if err := favorites.load(); err != nil && !os.IsNotExist(err) {
		log.Fatalf("could not load favorites store: %v", err)
	}

	go favorites.listen()

	// The upstream-compatible image still places the server binary at this
	// internal path; ZEITFOKUS_BINARY can override it for a fully renamed image.
	cmd := exec.Command(envCompat("ZEITFOKUS_BINARY", "TRAGGO_BINARY", "/opt/zeitfokus/zeitfokus"), os.Args[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		log.Fatalf("could not start Zeitfokus: %v", err)
	}

	forwardSignals(cmd)

	if err := cmd.Wait(); err != nil {
		log.Fatalf("Zeitfokus stopped: %v", err)
	}
}

func forwardSignals(cmd *exec.Cmd) {
	signals := make(chan os.Signal, 4)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		for sig := range signals {
			if cmd.Process == nil {
				continue
			}

			_ = syscall.Kill(-cmd.Process.Pid, sig.(syscall.Signal))
		}
	}()
}

func (s *FavoriteServer) listen() {
	mux := http.NewServeMux()
	mux.HandleFunc("/favorites", s.handleFavorites)

	addr := envCompat("ZEITFOKUS_FAVORITES_ADDR", "TRAGGO_FAVORITES_ADDR", ":3031")
	log.Printf("Zeitfokus favorites sync listening on %s", addr)
	srv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 32 << 10}
	log.Fatal(srv.ListenAndServe())
}

func (s *FavoriteServer) handleFavorites(w http.ResponseWriter, r *http.Request) {
	addCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if !s.authorized(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	user := r.URL.Query().Get("user")
	if user == "" || len(user) > 256 {
		http.Error(w, "missing user", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.get(w, user)

	case http.MethodPut:
		s.put(w, r, user)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *FavoriteServer) get(w http.ResponseWriter, user string) {
	s.mu.Lock()
	payload, ok := s.store[user]
	s.mu.Unlock()

	if !ok {
		http.NotFound(w, nil)
		return
	}

	writeJSON(w, payload)
}

func (s *FavoriteServer) put(w http.ResponseWriter, r *http.Request, user string) {
	defer r.Body.Close()

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	var payload Payload
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&payload); err != nil {
		http.Error(w, "invalid or oversized favorites payload", http.StatusBadRequest)
		return
	}

	if decoder.Decode(new(any)) != io.EOF || len(payload.Favorites) > 1000 {
		http.Error(w, "invalid favorites payload", http.StatusBadRequest)
		return
	}
	for _, f := range payload.Favorites {
		if len(f.ID) > 128 || len(f.Titel) > 4096 {
			http.Error(w, "favorite too large", http.StatusBadRequest)
			return
		}
	}
	s.mu.Lock()
	previous, existed := s.store[user]
	s.store[user] = payload
	err := s.saveLocked()
	if err != nil {
		if existed {
			s.store[user] = previous
		} else {
			delete(s.store, user)
		}
	}
	s.mu.Unlock()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, payload)
}

func (s *FavoriteServer) authorized(r *http.Request) bool {
	if s.token == "" {
		return s.allowUnauthenticated
	}

	return subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+s.token)) == 1
}

func (s *FavoriteServer) load() error {
	data, err := os.ReadFile(s.storePath)
	if err != nil {
		return err
	}

	if len(data) == 0 {
		return nil
	}

	return json.Unmarshal(data, &s.store)
}

func (s *FavoriteServer) saveLocked() error {
	if s.storePath == "" {
		return errors.New("empty store path")
	}

	if err := os.MkdirAll(filepath.Dir(s.storePath), 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s.store, "", "  ")
	if err != nil {
		return err
	}

	f, err := os.CreateTemp(filepath.Dir(s.storePath), ".favorites-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if _, err = f.Write(data); err != nil {
		f.Close()
		return err
	}
	if err = f.Sync(); err != nil {
		f.Close()
		return err
	}
	if err = f.Close(); err != nil {
		return err
	}
	return os.Rename(f.Name(), s.storePath)
}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(value)
}

func addCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func envBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value == "1" || value == "true" || value == "TRUE" || value == "yes" || value == "YES"
}

func envCompat(primary string, legacy string, fallback string) string {
	if value := os.Getenv(primary); value != "" {
		return value
	}
	return env(legacy, fallback)
}

func envBoolCompat(primary string, legacy string, fallback bool) bool {
	if value := os.Getenv(primary); value != "" {
		return value == "1" || value == "true" || value == "TRUE" || value == "yes" || value == "YES"
	}
	return envBool(legacy, fallback)
}
