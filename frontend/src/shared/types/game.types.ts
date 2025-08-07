export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
  x?: number;
  y?: number;
  isSelected?: boolean;
  isDragging?: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  isCurrentPlayer: boolean;
  isDealer?: boolean;
}

export interface GameState {
  gameId: string | null;
  players: Player[];
  currentPlayer: string | null;
  gamePhase: 'waiting' | 'playing' | 'finished';
  playedCards: Card[];
  deck: Card[];
  sharedZone: Card[];
}

export interface WebSocketMessage {
  type: string;
  gameId?: string;
  playerId?: string;
  data?: any;
}

export type GameScene = 'start' | 'game';