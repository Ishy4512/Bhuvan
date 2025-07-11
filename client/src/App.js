import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Room from './Room';
import './App.css';

// Define your secret key here. In a real app, this would be in an environment variable.
const ADMIN_SECRET_KEY = 'your_secret_admin_key'; // CHANGE THIS TO A SECURE KEY!

// Component for the initial room joining page
const JoinRoomPage = () => {
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const navigate = useNavigate();

  // Load username from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('watchTogetherUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchTogetherUsername', username);
  }, [username]);

  const handleJoin = () => {
    if (room.trim() !== '' && username.trim() !== '') {
      navigate(`/room/${room.trim()}`);
    }
  };

  const handleCreateRoom = () => {
    if (room.trim() !== '' && username.trim() !== '' && secretKey === ADMIN_SECRET_KEY) {
      navigate(`/room/${room.trim()}`);
    }
  };

  return (
    <div className="join-container">
      <input
        type="text"
        placeholder="Enter Your Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Room Name"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={handleJoin} disabled={!room.trim() || !username.trim()}>
        Join Room
      </button>

      <hr style={{ margin: '20px 0', width: '80%' }} />

      <input
        type="password"
        placeholder="Admin Secret Key (for creating rooms)"
        value={secretKey}
        onChange={(e) => setSecretKey(e.target.value)}
      />
      <button 
        onClick={handleCreateRoom} 
        disabled={!room.trim() || !username.trim() || secretKey !== ADMIN_SECRET_KEY}
      >
        Create Room
      </button>
      <p style={{ fontSize: '0.8em', color: '#aaa' }}>
        (Only you need the secret key to create new rooms. Others can just join.)
      </p>
    </div>
  );
};

// Wrapper component to get room ID and username from URL params/localStorage
const RoomWrapper = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('watchTogetherUsername');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      // If no username in localStorage, redirect to join page
      navigate('/');
    }
  }, [navigate]);

  // Only render Room component if username is available
  if (!username) {
    return null; // Or a loading spinner
  }

  return <Room room={roomId} username={username} />;
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Watch Together</h1>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<JoinRoomPage />} />
            <Route path="/room/:roomId" element={<RoomWrapper />} />
          </Routes>
        </BrowserRouter>
      </header>
    </div>
  );
}

export default App;
