-- Initialize card game database
CREATE DATABASE IF NOT EXISTS cardgame;

-- Create user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cardgame') THEN
      CREATE ROLE cardgame LOGIN PASSWORD 'cardgame123';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cardgame TO cardgame;

-- Switch to cardgame database
\c cardgame;

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(36) PRIMARY KEY,
    phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
    current_player VARCHAR(36),
    played_cards JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,
    game_id VARCHAR(36) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    hand JSONB DEFAULT '[]',
    score INTEGER DEFAULT 0,
    is_current_player BOOLEAN DEFAULT false,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at);

-- Grant table privileges to cardgame user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cardgame;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cardgame;

-- Insert sample data for testing
INSERT INTO games (id, phase, current_player) VALUES 
('test-game-1', 'waiting', NULL)
ON CONFLICT (id) DO NOTHING;

-- Add some helpful comments
COMMENT ON TABLE games IS 'Stores game state and metadata';
COMMENT ON TABLE players IS 'Stores player information and their hands';
COMMENT ON COLUMN games.played_cards IS 'JSON array of cards that have been played';
COMMENT ON COLUMN players.hand IS 'JSON array of cards in players hand';