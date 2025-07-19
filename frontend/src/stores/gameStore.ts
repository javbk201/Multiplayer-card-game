import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  isCurrentPlayer: boolean;
}

export interface UserProfile {
  id: string;
  playerName: string;
  avatar?: string;
  createdAt: Date;
}

export interface GameState {
  // User profile
  userProfile: UserProfile | null;
  isProfileCreated: boolean;
  
  // Game state
  gameId: string | null;
  players: Player[];
  currentPlayer: string | null;
  gamePhase: 'waiting' | 'playing' | 'finished';
  
  // WebSocket connection
  ws: WebSocket | null;
  connected: boolean;
  
  // UI state
  selectedCard: Card | null;
  showGame: boolean;
  currentScene: 'start' | 'game';
  
  // Actions
  // Profile actions
  createUserProfile: (playerName: string) => void;
  setCurrentScene: (scene: 'start' | 'game') => void;
  
  // Game actions
  setGameId: (gameId: string) => void;
  setPlayers: (players: Player[]) => void;
  setCurrentPlayer: (playerId: string) => void;
  setGamePhase: (phase: 'waiting' | 'playing' | 'finished') => void;
  
  // WebSocket actions
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
  sendMessage: (message: any) => void;
  
  // Game actions
  selectCard: (card: Card | null) => void;
  playCard: (card: Card) => void;
  setShowGame: (show: boolean) => void;
  
  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    userProfile: null,
    isProfileCreated: false,
    currentScene: 'start',
    
    gameId: null,
    players: [],
    currentPlayer: null,
    gamePhase: 'waiting',
    
    ws: null,
    connected: false,
    
    selectedCard: null,
    showGame: false,
    
    // Actions
    // Profile actions
    createUserProfile: (playerName) => {
      const profile: UserProfile = {
        id: crypto.randomUUID(),
        playerName,
        createdAt: new Date()
      };
      set({ 
        userProfile: profile, 
        isProfileCreated: true,
        currentScene: 'game'
      });
    },
    
    setCurrentScene: (scene) => set({ currentScene: scene }),
    
    // Game actions
    setGameId: (gameId) => set({ gameId }),
    setPlayers: (players) => set({ players }),
    setCurrentPlayer: (playerId) => set({ currentPlayer: playerId }),
    setGamePhase: (phase) => set({ gamePhase: phase }),
    
    // WebSocket actions
    connectWebSocket: (url) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        set({ connected: true });
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        set({ connected: false, ws: null });
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ connected: false });
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message, set, get);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      set({ ws });
    },
    
    disconnectWebSocket: () => {
      const { ws } = get();
      if (ws) {
        ws.close();
        set({ ws: null, connected: false });
      }
    },
    
    sendMessage: (message) => {
      const { ws, connected } = get();
      if (ws && connected) {
        ws.send(JSON.stringify(message));
      }
    },
    
    // Game actions
    selectCard: (card) => set({ selectedCard: card }),
    
    playCard: (card) => {
      const { sendMessage } = get();
      sendMessage({
        type: 'play_card',
        card
      });
      set({ selectedCard: null });
    },
    
    setShowGame: (show) => set({ showGame: show }),
    
    // Reset
    resetGame: () => set({
      gameId: null,
      players: [],
      currentPlayer: null,
      gamePhase: 'waiting',
      selectedCard: null,
      showGame: false,
      currentScene: 'start'
    })
  }))
);

// Handle incoming WebSocket messages
function handleWebSocketMessage(message: any, set: any, get: any) {
  switch (message.type) {
    case 'game_state':
      set({
        gameId: message.gameId,
        players: message.players,
        currentPlayer: message.currentPlayer,
        gamePhase: message.gamePhase
      });
      break;
      
    case 'player_joined':
      const { players } = get();
      set({ players: [...players, message.player] });
      break;
      
    case 'player_left':
      const updatedPlayers = get().players.filter((p: Player) => p.id !== message.playerId);
      set({ players: updatedPlayers });
      break;
      
    case 'card_played':
      // Handle card played by other players
      break;
      
    case 'game_ended':
      set({ gamePhase: 'finished' });
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}