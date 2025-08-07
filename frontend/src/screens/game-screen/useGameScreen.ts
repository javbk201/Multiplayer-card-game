import { useGameLogic } from '../../shared/hooks/useGameLogic';

export const useGameScreen = () => {
  const {
    gameState,
    currentPlayer,
    selectedCard,
    dealCards,
    playCard,
    dropCardInSharedZone,
    selectCard
  } = useGameLogic({
    wsUrl: 'ws://localhost:8000/ws'
  });

  return {
    gameState,
    currentPlayer,
    selectedCard,
    dealCards,
    playCard,
    dropCardInSharedZone,
    selectCard
  };
};