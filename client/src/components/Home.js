import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    if (username) {
      const newRoomId = Math.random().toString(36).substring(2, 15);
      navigate(`/room/${newRoomId}?username=${username}`);
    } else {
      alert('Please enter a username.');
    }
  };

  const joinRoom = () => {
    if (roomId && username) {
      navigate(`/room/${roomId}?username=${username}`);
    } else {
      alert('Please enter a room ID and a username.');
    }
  };

  return (
    <div>
      <h1>WatchTogether</h1>
      <div>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <button onClick={createRoom}>Create Room</button>
      <div>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}

export default Home;
