package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"card-game-backend/internal/game"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type Client struct {
	conn     *websocket.Conn
	send     chan []byte
	hub      *Hub
	gameID   string
	playerID string
}

type Hub struct {
	clients    map[*Client]bool
	gameClients map[string]map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	gameManager *game.GameManager
	mutex      sync.RWMutex
}

func NewHub(gameManager *game.GameManager) *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		gameClients: make(map[string]map[*Client]bool),
		broadcast:   make(chan []byte, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		gameManager: gameManager,
		mutex:       sync.RWMutex{},
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client connected: %p", client)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				
				// Remove from game clients
				if client.gameID != "" {
					if gameClients, exists := h.gameClients[client.gameID]; exists {
						delete(gameClients, client)
						if len(gameClients) == 0 {
							delete(h.gameClients, client.gameID)
						}
					}
					
					// Handle player leaving game
					if client.playerID != "" {
						h.handlePlayerLeave(client.gameID, client.playerID)
					}
				}
			}
			h.mutex.Unlock()
			log.Printf("Client disconnected: %p", client)

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) addClientToGame(client *Client, gameID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if h.gameClients[gameID] == nil {
		h.gameClients[gameID] = make(map[*Client]bool)
	}
	h.gameClients[gameID][client] = true
	client.gameID = gameID
}

func (h *Hub) broadcastToGame(gameID string, message []byte) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	if gameClients, exists := h.gameClients[gameID]; exists {
		for client := range gameClients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
				delete(gameClients, client)
			}
		}
	}
}

func (h *Hub) handlePlayerLeave(gameID, playerID string) {
	updatedGame, err := h.gameManager.LeaveGame(gameID, playerID)
	if err != nil {
		log.Printf("Error handling player leave: %v", err)
		return
	}

	if updatedGame != nil {
		// Broadcast player left message
		leftMessage := game.WebSocketMessage{
			Type: game.MsgPlayerLeft,
			Data: game.PlayerLeftData{PlayerID: playerID},
		}
		
		if messageBytes, err := json.Marshal(leftMessage); err == nil {
			h.broadcastToGame(gameID, messageBytes)
		}

		// Broadcast updated game state
		stateMessage := game.WebSocketMessage{
			Type: game.MsgGameState,
			Data: game.GameStateData{Game: *updatedGame},
		}
		
		if messageBytes, err := json.Marshal(stateMessage); err == nil {
			h.broadcastToGame(gameID, messageBytes)
		}
	}
}

func HandleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn: conn,
		send: make(chan []byte, 256),
		hub:  hub,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		var message game.WebSocketMessage
		if err := json.Unmarshal(messageBytes, &message); err != nil {
			log.Printf("JSON unmarshal error: %v", err)
			continue
		}

		c.handleMessage(message)
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

func (c *Client) handleMessage(message game.WebSocketMessage) {
	switch message.Type {
	case game.MsgJoinGame:
		c.handleJoinGame(message)
	case game.MsgPlayCard:
		c.handlePlayCard(message)
	case game.MsgDealCards:
		c.handleDealCards(message)
	case game.MsgDropCardShared:
		c.handleDropCardShared(message)
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

func (c *Client) handleJoinGame(message game.WebSocketMessage) {
	data, ok := message.Data.(map[string]interface{})
	if !ok {
		c.sendError("Invalid join game data")
		return
	}

	playerName, ok := data["playerName"].(string)
	if !ok || playerName == "" {
		c.sendError("Player name is required")
		return
	}

	gameID := message.GameID
	if gameID == "" {
		// Create new game if no game ID provided
		newGame := c.hub.gameManager.CreateGame()
		gameID = newGame.ID
	}

	updatedGame, player, err := c.hub.gameManager.JoinGame(gameID, playerName)
	if err != nil {
		c.sendError(err.Error())
		return
	}

	c.playerID = player.ID
	c.hub.addClientToGame(c, gameID)

	// Send game state to new player
	stateMessage := game.WebSocketMessage{
		Type: game.MsgGameState,
		Data: game.GameStateData{Game: *updatedGame},
	}
	
	if messageBytes, err := json.Marshal(stateMessage); err == nil {
		c.send <- messageBytes
	}

	// Broadcast player joined to other players
	joinedMessage := game.WebSocketMessage{
		Type: game.MsgPlayerJoined,
		Data: game.PlayerJoinedData{Player: *player},
	}
	
	if messageBytes, err := json.Marshal(joinedMessage); err == nil {
		c.hub.broadcastToGame(gameID, messageBytes)
	}
}

func (c *Client) handlePlayCard(message game.WebSocketMessage) {
	if c.gameID == "" || c.playerID == "" {
		c.sendError("Not in a game")
		return
	}

	data, ok := message.Data.(map[string]interface{})
	if !ok {
		c.sendError("Invalid play card data")
		return
	}

	cardData, ok := data["card"].(map[string]interface{})
	if !ok {
		c.sendError("Card data is required")
		return
	}

	card := game.Card{
		ID:    cardData["id"].(string),
		Suit:  game.Suit(cardData["suit"].(string)),
		Rank:  cardData["rank"].(string),
		Value: int(cardData["value"].(float64)),
	}

	updatedGame, err := c.hub.gameManager.PlayCard(c.gameID, c.playerID, card)
	if err != nil {
		c.sendError(err.Error())
		return
	}

	// Broadcast card played
	playedMessage := game.WebSocketMessage{
		Type: game.MsgCardPlayed,
		Data: game.CardPlayedData{
			PlayerID: c.playerID,
			Card:     card,
		},
	}
	
	if messageBytes, err := json.Marshal(playedMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}

	// Broadcast updated game state
	stateMessage := game.WebSocketMessage{
		Type: game.MsgGameState,
		Data: game.GameStateData{Game: *updatedGame},
	}
	
	if messageBytes, err := json.Marshal(stateMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}

	// Check if game ended
	if updatedGame.Phase == game.PhaseFinished {
		endMessage := game.WebSocketMessage{
			Type: game.MsgGameEnded,
			Data: game.GameStateData{Game: *updatedGame},
		}
		
		if messageBytes, err := json.Marshal(endMessage); err == nil {
			c.hub.broadcastToGame(c.gameID, messageBytes)
		}
	}
}

func (c *Client) handleDealCards(message game.WebSocketMessage) {
	if c.gameID == "" {
		c.sendError("Not in a game")
		return
	}

	updatedGame, err := c.hub.gameManager.DealCards(c.gameID)
	if err != nil {
		c.sendError(err.Error())
		return
	}

	// Broadcast cards dealt message
	dealtMessage := game.WebSocketMessage{
		Type: game.MsgCardsDealt,
		Data: game.GameStateData{Game: *updatedGame},
	}
	
	if messageBytes, err := json.Marshal(dealtMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}

	// Broadcast updated game state
	stateMessage := game.WebSocketMessage{
		Type: game.MsgGameState,
		Data: game.GameStateData{Game: *updatedGame},
	}
	
	if messageBytes, err := json.Marshal(stateMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}
}

func (c *Client) handleDropCardShared(message game.WebSocketMessage) {
	if c.gameID == "" || c.playerID == "" {
		c.sendError("Not in a game")
		return
	}

	data, ok := message.Data.(map[string]interface{})
	if !ok {
		c.sendError("Invalid drop card data")
		return
	}

	cardData, ok := data["card"].(map[string]interface{})
	if !ok {
		c.sendError("Card data is required")
		return
	}

	positionData, ok := data["position"].(map[string]interface{})
	if !ok {
		c.sendError("Position data is required")
		return
	}

	card := game.Card{
		ID:    cardData["id"].(string),
		Suit:  game.Suit(cardData["suit"].(string)),
		Rank:  cardData["rank"].(string),
		Value: int(cardData["value"].(float64)),
	}

	position := game.Position{
		X: positionData["x"].(float64),
		Y: positionData["y"].(float64),
	}

	updatedGame, err := c.hub.gameManager.DropCardInSharedZone(c.gameID, c.playerID, card, position)
	if err != nil {
		c.sendError(err.Error())
		return
	}

	// Broadcast card dropped
	droppedMessage := game.WebSocketMessage{
		Type: game.MsgCardDropped,
		Data: game.CardDroppedData{
			PlayerID: c.playerID,
			Card:     card,
			Position: position,
		},
	}
	
	if messageBytes, err := json.Marshal(droppedMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}

	// Broadcast updated game state
	stateMessage := game.WebSocketMessage{
		Type: game.MsgGameState,
		Data: game.GameStateData{Game: *updatedGame},
	}
	
	if messageBytes, err := json.Marshal(stateMessage); err == nil {
		c.hub.broadcastToGame(c.gameID, messageBytes)
	}
}

func (c *Client) sendError(message string) {
	errorMessage := game.WebSocketMessage{
		Type: game.MsgError,
		Data: game.ErrorData{Message: message},
	}
	
	if messageBytes, err := json.Marshal(errorMessage); err == nil {
		c.send <- messageBytes
	}
}