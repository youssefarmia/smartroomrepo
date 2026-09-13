import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  return (
    <div className="dashboard">
      <h1>Smart Room Dashboard</h1>

      <div className="sensor-cards">
        <div className="card">🌡️ Temperature: 22°C</div>
        <div className="card">💧 Humidity: 45%</div>
        <div className="card">💡 Light: 300 lux</div>
        <div className="card">🚶 Occupancy: Yes</div>
      </div>

      <div className="room-view">
        <p>Room View (placeholder)</p>
      </div>

      <div className="controls">
        <button>Toggle Fan</button>
        <button>Toggle Light</button>
      </div>
    </div>
  );
}

export default App;