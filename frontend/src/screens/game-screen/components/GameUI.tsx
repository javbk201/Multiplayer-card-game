import { GameState, Player } from '../../../shared/types/game.types';
import { useGameUI } from './useGameUI';
import './GameUI.css';

interface GameUIProps {
  gameState: GameState;
  currentPlayer: Player | null;
}

export const GameUI = ({ gameState, currentPlayer }: GameUIProps) => {
  const {
    handleDealCards,
    canDealCards,
    isCurrentPlayerTurn
  } = useGameUI({ gameState, currentPlayer });

  return (
    <div className="game-ui">
      <div className="game-info">
        <div className="game-id">
          Game ID: {gameState.gameId || 'Not connected'}
        </div>
        <div className="game-phase">
          Phase: {gameState.gamePhase}
        </div>
      </div>

      <div className="players-info">
        <h3>Players ({gameState.players.length})</h3>
        {gameState.players.map((player) => (
          <div 
            key={player.id} 
            className={`player-item ${player.isCurrentPlayer ? 'current-player' : ''}`}
          >
            <span className="player-name">{player.name}</span>
            <span className="player-cards">Cards: {player.hand.length}</span>
            <span className="player-score">Score: {player.score}</span>
          </div>
        ))}
      </div>

      <div className="game-controls">
        <button
          onClick={handleDealCards}
          disabled={!canDealCards}
          className="deal-cards-btn"
        >
          Deal Cards
        </button>
        
        {isCurrentPlayerTurn && (
          <div className="turn-indicator">
            Your Turn
          </div>
        )}
      </div>

      <div className="shared-zone-info">
        <h3>Shared Zone</h3>
        <div className="shared-cards-count">
          Cards: {gameState.sharedZone.length}
        </div>
      </div>
    </div>
  );
};