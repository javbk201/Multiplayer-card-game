import { useStartScreen } from './useStartScreen';
import { GameScene } from '../../shared/types/game.types';
import './StartScreen.css';

interface StartScreenProps {
  onSceneChange: (scene: GameScene) => void;
}

export const StartScreen = ({ onSceneChange }: StartScreenProps) => {
  const {
    playerName,
    gameId,
    isConnecting,
    setPlayerName,
    setGameId,
    handleJoinGame,
    handleCreateGame
  } = useStartScreen({ onSceneChange });

  return (
    <div className="start-screen">
      <div className="start-screen-content">
        <h1>Multiplayer Card Game</h1>
        
        <div className="form-group">
          <label htmlFor="playerName">Player Name:</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            disabled={isConnecting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gameId">Game ID (optional):</label>
          <input
            id="gameId"
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter game ID to join existing game"
            disabled={isConnecting}
          />
        </div>

        <div className="button-group">
          <button
            onClick={handleCreateGame}
            disabled={!playerName || isConnecting}
            className="create-game-btn"
          >
            {isConnecting ? 'Connecting...' : 'Create New Game'}
          </button>
          
          <button
            onClick={handleJoinGame}
            disabled={!playerName || !gameId || isConnecting}
            className="join-game-btn"
          >
            {isConnecting ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
};