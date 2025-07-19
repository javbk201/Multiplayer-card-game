package database

import (
	"database/sql"
	"log"
	
	_ "github.com/lib/pq"
)

func Initialize(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	log.Println("Database connected successfully")

	// Create tables if they don't exist
	if err := createTables(db); err != nil {
		return nil, err
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS games (
			id VARCHAR(36) PRIMARY KEY,
			phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
			current_player VARCHAR(36),
			played_cards JSONB DEFAULT '[]',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		
		`CREATE TABLE IF NOT EXISTS players (
			id VARCHAR(36) PRIMARY KEY,
			game_id VARCHAR(36) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			hand JSONB DEFAULT '[]',
			score INTEGER DEFAULT 0,
			is_current_player BOOLEAN DEFAULT false,
			connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		
		`CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id)`,
		`CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase)`,
		`CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			log.Printf("Error creating table: %v", err)
			return err
		}
	}

	log.Println("Database tables created/verified successfully")
	return nil
}