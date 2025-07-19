import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';
import { useGameStore } from '../stores/gameStore';

interface GameCanvasProps {
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ className }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentScene = useGameStore(state => state.currentScene);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      // Create Phaser game instance
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current
      });
    }

    return () => {
      // Cleanup on unmount
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Switch scenes based on currentScene state
  useEffect(() => {
    if (gameRef.current) {
      const targetScene = currentScene === 'start' ? 'StartScene' : 'MainScene';
      
      // Check if we need to switch scenes
      const currentActiveScene = gameRef.current.scene.getScene(targetScene);
      if (currentActiveScene && !currentActiveScene.scene.isActive()) {
        // Stop all scenes and start the target scene
        gameRef.current.scene.stop('StartScene');
        gameRef.current.scene.stop('MainScene');
        gameRef.current.scene.start(targetScene);
      } else if (!currentActiveScene) {
        // If the scene doesn't exist, start it
        gameRef.current.scene.start(targetScene);
      }
    }
  }, [currentScene]);

  return (
    <div 
      ref={containerRef} 
      id="phaser-game" 
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};