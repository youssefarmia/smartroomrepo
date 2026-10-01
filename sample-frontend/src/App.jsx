import { useState, useEffect } from 'react';
import './App.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import lightOnEmptyImg from './assets/light-on.png';
import lightOffEmptyImg from './assets/light-off.png';
import lightOnOccImg from './assets/light-on-occupied.png';
import lightOffOccImg from './assets/light-off-occupied.png';

function App() {
  // Sensor state — these are the "live" values that will change over time
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(45);
  const [light, setLight] = useState(300);
  const [occupied, setOccupied] = useState(true);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const FAN_AUTO_THRESHOLD = 26;
  // Device state — controlled by the buttons
  const [fanOn, setFanOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [Energy, setEnergy] = useState(null);

  // Replace your existing fan/light useState-only toggle functions with these:

  const toggleFan = () => {
    fetch('http://127.0.0.1:8000/devices/fan/toggle', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setFanOn(data.state))
    .catch((err) => console.error('Failed to toggle fan:', err));
  };

  const toggleLight = () => {
    fetch('http://127.0.0.1:8000/devices/light/toggle', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setLightOn(data.state))
      .catch((err) => console.error('Failed to toggle light:', err));
  };

  const loadHistory = () => {
  setLoading(true);
  setError(null);
  Promise.all([
    fetch('http://127.0.0.1:8000/history').then((res) => res.json()),
    fetch('http://127.0.0.1:8000/events').then((res) => res.json()),
    fetch('http://127.0.0.1:8000/energy').then((res) => res.json()),
  ])
    .then(([historyData, eventsData, energyData]) => {
      setHistory(historyData);
      setEvents(eventsData);
      setEnergy(energyData);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Failed to fetch history/events/energy:', err);
      setError('Could not load history.');
      setLoading(false);
    });
};

const handleShowHistory = () => {
  const next = !showHistory;
  setShowHistory(next);
  if (next) {
    loadHistory(); // only fetch when opening, not when closing
  }
};



  //checks device state on start
  useEffect(() => {
  fetch('http://127.0.0.1:8000/devices')
    .then((res) => res.json())
    .then((data) => {
      setFanOn(data.fan);
      setLightOn(data.light);
    })
    .catch((err) => console.error('Failed to fetch device state:', err));
}, []); // empty array = runs once when the page loads

  //ask for history
  useEffect(() => {
  Promise.all([
    fetch('http://127.0.0.1:8000/history').then((res) => res.json()),
    fetch('http://127.0.0.1:8000/events').then((res) => res.json()),
  ])
    .then(([historyData, eventsData]) => {
      setHistory(historyData);
      setEvents(eventsData);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Failed to fetch history/events:', err);
      setError('Could not load history.');
      setLoading(false);
    });
}, []); // empty array = runs once when the page first loads

useEffect(() => {
  const fetchDevices = () => {
    fetch('http://127.0.0.1:8000/devices')
      .then((res) => res.json())
      .then((data) => {
        setFanOn(data.fan);
        setLightOn(data.light);
      })
      .catch((err) => console.error('Failed to fetch device state:', err));
  };

  fetchDevices();
  const interval = setInterval(fetchDevices, 2000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
  const fetchSensors = () => {
    fetch('http://127.0.0.1:8000/sensors')
      .then((res) => res.json())
      .then((data) => {
        setTemperature(data.temperature);
        setHumidity(data.humidity);
        setLight(data.light);
        setOccupied(data.occupied);
      })
      .catch((err) => console.error('Failed to fetch sensors:', err));
  };

  fetchSensors(); // initial load
  const interval = setInterval(fetchSensors, 500); // poll every 2s

  return () => clearInterval(interval);
}, []);

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
  <img
  src={
    lightOn
      ? (occupied ? lightOnOccImg : lightOnEmptyImg)
      : (occupied ? lightOffOccImg : lightOffEmptyImg)
  }
  alt={`Room is ${occupied ? 'occupied' : 'empty'}, light is ${lightOn ? 'on' : 'off'}`}
  className="room-image"
/>
</div>

      <div className="controls">
      <button
  onClick={toggleFan}
  aria-label={`Turn fan ${fanOn ? 'off' : 'on'}`}
  title={`Turn fan ${fanOn ? 'off' : 'on'}`}
>
  Fan: {fanOn ? 'ON' : 'OFF'}
</button>

<button
  onClick={toggleLight}
  aria-label={`Turn light ${lightOn ? 'off' : 'on'}`}
  title={`Turn light ${lightOn ? 'off' : 'on'}`}
>
  Light: {lightOn ? 'ON' : 'OFF'}
</button>

<button
  onClick={handleShowHistory}
  aria-label={showHistory ? 'Hide history section' : 'Show history section'}
  title={showHistory ? 'Hide history section' : 'Show history section'}
>
  {showHistory ? 'Hide History' : 'Show History'}
</button>
      </div>
     {showHistory && (
  <div className="history-section">
    <h2>Temperature History</h2>
    {loading && <p>Loading...</p>}
    {error && <p>{error}</p>}
    {!loading && !error && history.length === 0 && <p>No data yet.</p>}
    {!loading && !error && history.length > 0 && (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="temperature" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    
      
    )}

    <h2>Energy Usage</h2>
    {Energy && (
      <ul>
        {Object.entries(Energy).map(([device, stats]) => (
          <li key={device}>
            {device}: {stats.Energy_wh} Wh ({stats.hours_on.toFixed(2)}h @ {stats.watts}W)
          </li>
        ))}
      </ul>
    )}

     <h2>Event Log</h2>
    {!loading && !error && events.length === 0 && <p>No events yet.</p>}
    {!loading && !error && events.length > 0 && (
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.device} turned {e.new_state ? 'ON' : 'OFF'}
            {e.triggered_by === 'automation' ? ' automatically' : ''}
            {' '}at {new Date(e.timestamp).toLocaleTimeString()}
            {e.reason && <span className="reason"> — {e.reason}</span>}
          </li>
        ))}
      </ul>
    )}
   
  </div>
)}
    </div>

     
  );
}

export default App;