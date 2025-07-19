import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import './StartScreen.css';

export const StartScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const createUserProfile = useGameStore(state => state.createUserProfile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (playerName.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }
    
    if (playerName.trim().length > 20) {
      alert('El nombre no puede tener más de 20 caracteres');
      return;
    }

    setIsLoading(true);
    
    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      createUserProfile(playerName.trim());
      setIsLoading(false);
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir letras, números y espacios
    if (/^[a-zA-Z0-9\s]*$/.test(value)) {
      setPlayerName(value);
    }
  };

  return (
    <div className="start-screen">
      <div className="start-container">
        <div className="game-title">
          <h1>🃏 Card Game Multiplayer</h1>
          <p>Juego de cartas multijugador en tiempo real</p>
        </div>

        <div className="profile-form-container">
          <h2>Crear Perfil</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="playerName">
                Nombre de Jugador:
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={handleInputChange}
                placeholder="Ingresa tu nombre..."
                maxLength={20}
                minLength={2}
                required
                disabled={isLoading}
                className="player-name-input"
              />
              <small className="form-hint">
                2-20 caracteres (letras, números y espacios)
              </small>
            </div>

            <button 
              type="submit" 
              className="start-game-btn"
              disabled={isLoading || playerName.trim().length < 2}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creando perfil...
                </>
              ) : (
                'Comenzar a Jugar'
              )}
            </button>
          </form>
        </div>

        <div className="game-info">
          <h3>🎮 Características del Juego</h3>
          <ul>
            <li>🌐 Multijugador en tiempo real</li>
            <li>👥 2-4 jugadores por partida</li>
            <li>🃏 Baraja estándar de 52 cartas</li>
            <li>⚡ Conexión WebSocket</li>
            <li>🎯 Sin registro requerido</li>
          </ul>
        </div>

        <div className="game-instructions">
          <details>
            <summary>📋 Cómo Jugar</summary>
            <ol>
              <li>Crea tu perfil con un nombre único</li>
              <li>Únete a una partida o crea una nueva</li>
              <li>Espera a que se conecten otros jugadores</li>
              <li>Juega tus cartas por turnos</li>
              <li>¡El objetivo es quedarte sin cartas!</li>
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
};