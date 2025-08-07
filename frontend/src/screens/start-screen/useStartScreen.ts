import { useState, useCallback } from 'react';
import { useGameLogic } from '../../shared/hooks/useGameLogic';
import { GameScene } from '../../shared/types/game.types';

interface UseStartScreenProps {
  onSceneChange: (scene: GameScene) => void;
}

export const useStartScreen = ({ onSceneChange }: UseStartScreenProps) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { connect, joinGame } = useGameLogic({
    wsUrl: 'ws://localhost:8000/ws'
  });

  const handleJoinGame = useCallback(async () => {
    if (!playerName) return;
    
    setIsConnecting(true);
    try {
      await connect();
      joinGame(playerName, gameId);
      onSceneChange('game');
    } catch (error) {
      console.error('Failed to join game:', error);
      setIsConnecting(false);
    }
  }, [playerName, gameId, connect, joinGame, onSceneChange]);

  const handleCreateGame = useCallback(async () => {
    if (!playerName) return;
    
    setIsConnecting(true);
    try {
      await connect();
      joinGame(playerName);
      onSceneChange('game');
    } catch (error) {
      console.error('Failed to create game:', error);
      setIsConnecting(false);
    }
  }, [playerName, connect, joinGame, onSceneChange]);

  return {
    playerName,
    gameId,
    isConnecting,
    setPlayerName,
    setGameId,
    handleJoinGame,
    handleCreateGame
  };
};