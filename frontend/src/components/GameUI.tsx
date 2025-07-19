import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const GameUI: React.FC = () => {
  const {
    gameId,
    players,
    currentPlayer,
    gamePhase,
    connected,
    selectedCard,
    playCard,
    connectWebSocket,
    disconnectWebSocket,
    resetGame
  } = useGameStore();

  const handleConnect = () => {
    connectWebSocket('ws://localhost:8000/ws');
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      playCard(selectedCard);
    }
  };

  return (
    <div className="game-ui">
      {/* Connection Status */}
      <div className="connection-status">
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢' : '🔴'}
        </span>
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
        <button onClick={connected ? disconnectWebSocket : handleConnect}>
          {connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Game Info */}
      <div className="game-info">
        <div>Game ID: {gameId || 'N/A'}</div>
        <div>Phase: {gamePhase}</div>
        <div>Players: {players.length}</div>
        <div>Current Player: {currentPlayer || 'N/A'}</div>
      </div>

      {/* Player List */}
      <div className="players-list">
        <h3>Players</h3>
        {players.map((player) => (
          <div key={player.id} className={`player ${player.isCurrentPlayer ? 'current' : ''}`}>
            <span>{player.name}</span>
            <span>Score: {player.score}</span>
            <span>Cards: {player.hand.length}</span>
          </div>
        ))}
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        {selectedCard && (
          <div className="selected-card">
            <span>Selected: {selectedCard.rank} of {selectedCard.suit}</span>
            <button onClick={handlePlayCard} disabled={gamePhase !== 'playing'}>
              Play Card
            </button>
          </div>
        )}
        
        <button onClick={resetGame}>Reset Game</button>
      </div>

      {/* Game Phase Messages */}
      <div className="game-messages">
        {gamePhase === 'waiting' && <p>Waiting for players...</p>}
        {gamePhase === 'playing' && <p>Game in progress</p>}
        {gamePhase === 'finished' && <p>Game finished!</p>}
      </div>
    </div>
  );
};