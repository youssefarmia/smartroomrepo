import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Sensor state — these are the "live" values that will change over time
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(45);
  const [light, setLight] = useState(300);
  const [occupied, setOccupied] = useState(true);

  // Device state — controlled by the buttons
  const [fanOn, setFanOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);

  // Effect 1: gradually drift temperature and humidity every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature((prev) => {
        const baseline = 25;
        let change;
        if (fanOn){
                 const tempstabilizing = 0.05;
        change = -0.3 + (baseline - prev)*tempstabilizing + (Math.random()-0.5)*0.2;
        }
        else{
          const tempstabilizing = 0.05;
        change = (baseline - prev)*tempstabilizing + (Math.random()-0.5)*0.2;
        }
        const next = prev + change;
        return next;
      });

      setHumidity((prev) => {
        const change = (Math.random() - 0.5) * 1;
        const next = prev + change;
        return Math.min(70, Math.max(30, next));
      });
    }, 2000); // runs every 2000ms = 2 seconds

    // Cleanup: stops the timer if the component unmounts or fanOn changes
    return () => clearInterval(interval);
  }, [fanOn]); // re-run this effect whenever fanOn changes

  // Effect 2: light level responds to the light toggle
  useEffect(() => {
    setLight(lightOn ? 800 : 300);
  }, [lightOn]);

  // Effect 3: occupancy flips randomly every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setOccupied((prev) => (Math.random() > 0.3 ? prev : !prev));
    }, 20000);

    return () => clearInterval(interval);
  }, []); // empty array = only set up once, never re-run

  return (
    <div className="dashboard">
      <h1>Smart Room Dashboard</h1>

      <div className="sensor-cards">
        <div className="card">🌡️ Temperature: {temperature.toFixed(1)}°C</div>
        <div className="card">💧 Humidity: {humidity.toFixed(0)}%</div>
        <div className="card">💡 Light: {light} lux</div>
        <div className="card">🚶 Occupancy: {occupied ? 'Yes' : 'No'}</div>
      </div>

      <div className="room-view">
        <p>Room View (placeholder)</p>
      </div>

      <div className="controls">
        <button onClick={() => setFanOn(!fanOn)}>
          Fan: {fanOn ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => setLightOn(!lightOn)}>
          Light: {lightOn ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

export default App;