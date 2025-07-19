import { GameCanvas } from './components/GameCanvas'
import { GameUI } from './components/GameUI'
import { StartScreen } from './components/StartScreen'
import { useGameStore } from './stores/gameStore'
import './App.css'
import './components/GameUI.css'

function App() {
  const currentScene = useGameStore(state => state.currentScene);

  return (
    <div className="app">
      <div className="game-container">
        <GameCanvas className="game-canvas" />
        {currentScene === 'start' && <StartScreen />}
        {currentScene === 'game' && <GameUI />}
      </div>
    </div>
  )
}

export default App
