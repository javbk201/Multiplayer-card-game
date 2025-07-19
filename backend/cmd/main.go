package main

import (
	"log"
	"net/http"
	"os"

	"card-game-backend/internal/database"
	"card-game-backend/internal/game"
	"card-game-backend/internal/websocket"
)

func main() {
	// Initialize database
	db, err := database.Initialize(getDBURL())
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Create game manager
	gameManager := game.NewGameManager(db)

	// Create WebSocket hub
	hub := websocket.NewHub(gameManager)
	go hub.Run()

	// Setup routes
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.HandleWebSocket(hub, w, r)
	})

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// CORS middleware for development
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		w.WriteHeader(http.StatusNotFound)
	})

	port := getPort()
	log.Printf("Starting server on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	return port
}

func getDBURL() string {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://cardgame:cardgame123@localhost:5432/cardgame?sslmode=disable"
	}
	return dbURL
}