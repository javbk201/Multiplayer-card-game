import { useCallback, useState } from 'react';
import { Card, Player, GameState } from '../types/game.types';
import { useWebSocket } from './useWebSocket';

interface UseGameLogicProps {
  wsUrl: string;
}

export const useGameLogic = ({ wsUrl }: UseGameLogicProps) => {
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    players: [],
    currentPlayer: null,
    gamePhase: 'waiting',
    playedCards: [],
    deck: [],
    sharedZone: []
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'game_state':
        setGameState(prevState => ({
          ...prevState,
          gameId: message.gameId,
          players: message.players,
          currentPlayer: message.currentPlayer,
          gamePhase: message.gamePhase,
          playedCards: message.playedCards || [],
          sharedZone: message.sharedZone || []
        }));
        break;

      case 'player_joined':
        setGameState(prevState => ({
          ...prevState,
          players: [...prevState.players, message.player]
        }));
        break;

      case 'player_left':
        setGameState(prevState => ({
          ...prevState,
          players: prevState.players.filter((p: Player) => p.id !== message.playerId)
        }));
        break;

      case 'card_played':
        setGameState(prevState => ({
          ...prevState,
          playedCards: [...prevState.playedCards, message.card],
          sharedZone: [...prevState.sharedZone, message.card]
        }));
        break;

      case 'cards_dealt':
        setGameState(prevState => ({
          ...prevState,
          players: message.players,
          deck: message.deck
        }));
        break;

      case 'game_ended':
        setGameState(prevState => ({
          ...prevState,
          gamePhase: 'finished'
        }));
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  const { connect, disconnect, sendMessage, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('Connected to game server'),
    onDisconnect: () => console.log('Disconnected from game server'),
    onError: (error) => console.error('WebSocket error:', error)
  });

  const joinGame = useCallback((playerName: string, gameId?: string) => {
    const player: Player = {
      id: crypto.randomUUID(),
      name: playerName,
      hand: [],
      score: 0,
      isCurrentPlayer: false
    };
    
    setCurrentPlayer(player);
    
    sendMessage({
      type: 'join_game',
      data: {
        playerName,
        gameId
      }
    });
  }, [sendMessage]);

  const dealCards = useCallback(() => {
    sendMessage({
      type: 'deal_cards'
    });
  }, [sendMessage]);

  const playCard = useCallback((card: Card) => {
    sendMessage({
      type: 'play_card',
      data: { card }
    });
    setSelectedCard(null);
  }, [sendMessage]);

  const dropCardInSharedZone = useCallback((card: Card, x: number, y: number) => {
    sendMessage({
      type: 'drop_card_shared',
      data: { 
        card,
        position: { x, y }
      }
    });
  }, [sendMessage]);

  const selectCard = useCallback((card: Card | null) => {
    setSelectedCard(card);
  }, []);

  return {
    gameState,
    currentPlayer,
    selectedCard,
    connect,
    disconnect,
    isConnected,
    joinGame,
    dealCards,
    playCard,
    dropCardInSharedZone,
    selectCard
  };
};