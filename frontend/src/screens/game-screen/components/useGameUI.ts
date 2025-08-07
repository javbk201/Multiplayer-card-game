import { useCallback } from 'react';
import { GameState, Player } from '../../../shared/types/game.types';
import { useGameLogic } from '../../../shared/hooks/useGameLogic';

interface UseGameUIProps {
  gameState: GameState;
  currentPlayer: Player | null;
}

export const useGameUI = ({ gameState, currentPlayer }: UseGameUIProps) => {
  const { dealCards } = useGameLogic({
    wsUrl: 'ws://localhost:8000/ws'
  });

  const handleDealCards = useCallback(() => {
    dealCards();
  }, [dealCards]);

  const canDealCards = gameState.gamePhase === 'waiting' && 
                      gameState.players.length >= 2 &&
                      gameState.players.every(player => player.hand.length === 0);

  const isCurrentPlayerTurn = currentPlayer?.id === gameState.currentPlayer;

  return {
    handleDealCards,
    canDealCards,
    isCurrentPlayerTurn
  };
};