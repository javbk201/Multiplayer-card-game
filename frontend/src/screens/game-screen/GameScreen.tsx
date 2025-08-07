import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { useGameScreen } from './useGameScreen';

export const GameScreen = () => {
  const { gameState, currentPlayer } = useGameScreen();

  return (
    <div className="game-screen">
      <GameCanvas />
      <GameUI 
        gameState={gameState}
        currentPlayer={currentPlayer}
      />
    </div>
  );
};