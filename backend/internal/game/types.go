package game

import (
	"time"
	"github.com/google/uuid"
)

type Suit string

const (
	Hearts   Suit = "hearts"
	Diamonds Suit = "diamonds"
	Clubs    Suit = "clubs"
	Spades   Suit = "spades"
)

type Card struct {
	ID    string `json:"id"`
	Suit  Suit   `json:"suit"`
	Rank  string `json:"rank"`
	Value int    `json:"value"`
}

type Player struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Hand            []Card `json:"hand"`
	Score           int    `json:"score"`
	IsCurrentPlayer bool   `json:"isCurrentPlayer"`
	ConnectedAt     time.Time `json:"-"`
}

type GamePhase string

const (
	PhaseWaiting  GamePhase = "waiting"
	PhasePlaying  GamePhase = "playing"
	PhaseFinished GamePhase = "finished"
)

type Game struct {
	ID            string    `json:"id"`
	Players       []Player  `json:"players"`
	CurrentPlayer string    `json:"currentPlayer"`
	Phase         GamePhase `json:"gamePhase"`
	Deck          []Card    `json:"-"`
	PlayedCards   []Card    `json:"playedCards"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Message types for WebSocket communication
type MessageType string

const (
	MsgJoinGame    MessageType = "join_game"
	MsgLeaveGame   MessageType = "leave_game"
	MsgPlayCard    MessageType = "play_card"
	MsgGameState   MessageType = "game_state"
	MsgPlayerJoined MessageType = "player_joined"
	MsgPlayerLeft   MessageType = "player_left"
	MsgCardPlayed   MessageType = "card_played"
	MsgGameEnded    MessageType = "game_ended"
	MsgError        MessageType = "error"
)

type WebSocketMessage struct {
	Type    MessageType `json:"type"`
	GameID  string      `json:"gameId,omitempty"`
	PlayerID string     `json:"playerId,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Game actions
type JoinGameData struct {
	PlayerName string `json:"playerName"`
	GameID     string `json:"gameId,omitempty"`
}

type PlayCardData struct {
	Card Card `json:"card"`
}

type GameStateData struct {
	Game Game `json:"game"`
}

type PlayerJoinedData struct {
	Player Player `json:"player"`
}

type PlayerLeftData struct {
	PlayerID string `json:"playerId"`
}

type CardPlayedData struct {
	PlayerID string `json:"playerId"`
	Card     Card   `json:"card"`
}

type ErrorData struct {
	Message string `json:"message"`
}

// NewCard creates a new card
func NewCard(suit Suit, rank string, value int) Card {
	return Card{
		ID:    uuid.New().String(),
		Suit:  suit,
		Rank:  rank,
		Value: value,
	}
}

// NewPlayer creates a new player
func NewPlayer(name string) Player {
	return Player{
		ID:              uuid.New().String(),
		Name:            name,
		Hand:            make([]Card, 0),
		Score:           0,
		IsCurrentPlayer: false,
		ConnectedAt:     time.Now(),
	}
}

// NewGame creates a new game
func NewGame() *Game {
	return &Game{
		ID:            uuid.New().String(),
		Players:       make([]Player, 0),
		CurrentPlayer: "",
		Phase:         PhaseWaiting,
		Deck:          createDeck(),
		PlayedCards:   make([]Card, 0),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
}

// createDeck creates a standard 52-card deck
func createDeck() []Card {
	suits := []Suit{Hearts, Diamonds, Clubs, Spades}
	ranks := []struct {
		rank  string
		value int
	}{
		{"A", 1}, {"2", 2}, {"3", 3}, {"4", 4}, {"5", 5}, {"6", 6}, {"7", 7},
		{"8", 8}, {"9", 9}, {"10", 10}, {"J", 11}, {"Q", 12}, {"K", 13},
	}

	deck := make([]Card, 0, 52)
	for _, suit := range suits {
		for _, rank := range ranks {
			deck = append(deck, NewCard(suit, rank.rank, rank.value))
		}
	}

	return deck
}