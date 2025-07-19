package game

import (
	"database/sql"
	"errors"
	"math/rand"
	"sync"
	"time"
)

type GameManager struct {
	games map[string]*Game
	mutex sync.RWMutex
	db    *sql.DB
}

func NewGameManager(db *sql.DB) *GameManager {
	return &GameManager{
		games: make(map[string]*Game),
		mutex: sync.RWMutex{},
		db:    db,
	}
}

// CreateGame creates a new game
func (gm *GameManager) CreateGame() *Game {
	gm.mutex.Lock()
	defer gm.mutex.Unlock()

	game := NewGame()
	gm.games[game.ID] = game
	return game
}

// GetGame retrieves a game by ID
func (gm *GameManager) GetGame(gameID string) (*Game, error) {
	gm.mutex.RLock()
	defer gm.mutex.RUnlock()

	game, exists := gm.games[gameID]
	if !exists {
		return nil, errors.New("game not found")
	}
	return game, nil
}

// JoinGame adds a player to a game
func (gm *GameManager) JoinGame(gameID, playerName string) (*Game, *Player, error) {
	gm.mutex.Lock()
	defer gm.mutex.Unlock()

	game, exists := gm.games[gameID]
	if !exists {
		// Create new game if it doesn't exist
		game = NewGame()
		game.ID = gameID
		gm.games[gameID] = game
	}

	// Check if game is full (max 4 players for this card game)
	if len(game.Players) >= 4 {
		return nil, nil, errors.New("game is full")
	}

	// Check if player name already exists
	for _, player := range game.Players {
		if player.Name == playerName {
			return nil, nil, errors.New("player name already exists")
		}
	}

	// Create new player
	player := NewPlayer(playerName)
	
	// Deal initial hand (5 cards)
	hand, err := gm.dealCards(game, 5)
	if err != nil {
		return nil, nil, err
	}
	player.Hand = hand

	// Add player to game
	game.Players = append(game.Players, player)

	// Set as current player if first player
	if len(game.Players) == 1 {
		game.CurrentPlayer = player.ID
		player.IsCurrentPlayer = true
	}

	// Start game if we have enough players
	if len(game.Players) >= 2 && game.Phase == PhaseWaiting {
		game.Phase = PhasePlaying
	}

	game.UpdatedAt = time.Now()
	return game, &player, nil
}

// LeaveGame removes a player from a game
func (gm *GameManager) LeaveGame(gameID, playerID string) (*Game, error) {
	gm.mutex.Lock()
	defer gm.mutex.Unlock()

	game, exists := gm.games[gameID]
	if !exists {
		return nil, errors.New("game not found")
	}

	// Find and remove player
	playerIndex := -1
	for i, player := range game.Players {
		if player.ID == playerID {
			playerIndex = i
			break
		}
	}

	if playerIndex == -1 {
		return nil, errors.New("player not found in game")
	}

	// Remove player
	game.Players = append(game.Players[:playerIndex], game.Players[playerIndex+1:]...)

	// Update current player if necessary
	if game.CurrentPlayer == playerID && len(game.Players) > 0 {
		game.CurrentPlayer = game.Players[0].ID
		game.Players[0].IsCurrentPlayer = true
	}

	// End game if not enough players
	if len(game.Players) < 2 && game.Phase == PhasePlaying {
		game.Phase = PhaseWaiting
	}

	// Delete game if no players left
	if len(game.Players) == 0 {
		delete(gm.games, gameID)
		return nil, nil
	}

	game.UpdatedAt = time.Now()
	return game, nil
}

// PlayCard handles a player playing a card
func (gm *GameManager) PlayCard(gameID, playerID string, card Card) (*Game, error) {
	gm.mutex.Lock()
	defer gm.mutex.Unlock()

	game, exists := gm.games[gameID]
	if !exists {
		return nil, errors.New("game not found")
	}

	if game.Phase != PhasePlaying {
		return nil, errors.New("game is not in playing phase")
	}

	if game.CurrentPlayer != playerID {
		return nil, errors.New("not your turn")
	}

	// Find player
	playerIndex := -1
	for i, player := range game.Players {
		if player.ID == playerID {
			playerIndex = i
			break
		}
	}

	if playerIndex == -1 {
		return nil, errors.New("player not found")
	}

	// Find and remove card from player's hand
	cardIndex := -1
	for i, handCard := range game.Players[playerIndex].Hand {
		if handCard.ID == card.ID {
			cardIndex = i
			break
		}
	}

	if cardIndex == -1 {
		return nil, errors.New("card not found in player's hand")
	}

	// Remove card from hand
	game.Players[playerIndex].Hand = append(
		game.Players[playerIndex].Hand[:cardIndex],
		game.Players[playerIndex].Hand[cardIndex+1:]...,
	)

	// Add to played cards
	game.PlayedCards = append(game.PlayedCards, card)

	// Move to next player
	gm.nextPlayer(game)

	// Check for game end condition
	if len(game.Players[playerIndex].Hand) == 0 {
		game.Phase = PhaseFinished
		game.Players[playerIndex].Score += 100 // Winner bonus
	}

	game.UpdatedAt = time.Now()
	return game, nil
}

// dealCards deals a specified number of cards from the deck
func (gm *GameManager) dealCards(game *Game, count int) ([]Card, error) {
	if len(game.Deck) < count {
		return nil, errors.New("not enough cards in deck")
	}

	// Shuffle deck if needed
	if len(game.PlayedCards) == 0 {
		gm.shuffleDeck(game.Deck)
	}

	// Deal cards
	cards := make([]Card, count)
	copy(cards, game.Deck[:count])
	game.Deck = game.Deck[count:]

	return cards, nil
}

// shuffleDeck shuffles the game deck
func (gm *GameManager) shuffleDeck(deck []Card) {
	rand.Seed(time.Now().UnixNano())
	for i := len(deck) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		deck[i], deck[j] = deck[j], deck[i]
	}
}

// nextPlayer moves to the next player
func (gm *GameManager) nextPlayer(game *Game) {
	if len(game.Players) <= 1 {
		return
	}

	// Find current player index
	currentIndex := -1
	for i, player := range game.Players {
		if player.ID == game.CurrentPlayer {
			currentIndex = i
			game.Players[i].IsCurrentPlayer = false
			break
		}
	}

	if currentIndex == -1 {
		return
	}

	// Move to next player
	nextIndex := (currentIndex + 1) % len(game.Players)
	game.CurrentPlayer = game.Players[nextIndex].ID
	game.Players[nextIndex].IsCurrentPlayer = true
}

// ListGames returns all active games
func (gm *GameManager) ListGames() []*Game {
	gm.mutex.RLock()
	defer gm.mutex.RUnlock()

	games := make([]*Game, 0, len(gm.games))
	for _, game := range gm.games {
		games = append(games, game)
	}
	return games
}

// CleanupGame removes a game from memory
func (gm *GameManager) CleanupGame(gameID string) {
	gm.mutex.Lock()
	defer gm.mutex.Unlock()
	delete(gm.games, gameID)
}