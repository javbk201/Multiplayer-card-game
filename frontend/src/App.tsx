import { useState } from 'react';
import { StartScreen } from './screens/start-screen/StartScreen';
import { GameScreen } from './screens/game-screen/GameScreen';
import { GameScene } from './shared/types/game.types';
import './App.css';

function App() {
  const [currentScene, setCurrentScene] = useState<GameScene>('start');

  const handleSceneChange = (scene: GameScene) => {
    setCurrentScene(scene);
  };

  return (
    <div className="app">
      <div className="game-container">
        {currentScene === 'start' && (
          <StartScreen onSceneChange={handleSceneChange} />
        )}
        {currentScene === 'game' && (
          <GameScreen />
        )}
      </div>
    </div>
  );
}

export default App;
