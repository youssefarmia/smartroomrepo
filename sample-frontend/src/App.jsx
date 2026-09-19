import { useState, useEffect } from 'react';
import './App.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  // Device state — controlled by the buttons
  const [fanOn, setFanOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);

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
       <button onClick={toggleFan}>
        Fan: {fanOn ? 'ON' : 'OFF'}
       </button>
       <button onClick={toggleLight}>
        Light: {lightOn ? 'ON' : 'OFF'}
       </button>
           <button onClick={handleShowHistory}>{showHistory ?'hide history':'show history'}</button>
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
     <h2>Event Log</h2>
    {!loading && !error && events.length === 0 && <p>No events yet.</p>}
    {!loading && !error && events.length > 0 && (
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.device} turned {e.new_state ? 'ON' : 'OFF'} at{' '}
            {new Date(e.timestamp).toLocaleTimeString()}
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