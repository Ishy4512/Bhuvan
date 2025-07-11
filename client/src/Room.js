import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import io from 'socket.io-client';

// Connect to the Socket.IO server
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000');

const Room = ({ room, username }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [playerUrl, setPlayerUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false); // New state for seeking
  const [users, setUsers] = useState([]); // New state for users in the room
  const playerRef = useRef(null);

  // Effect for Socket.IO events
  useEffect(() => {
    // Join the specified room when the component mounts
    socket.emit('join_room', { room, username });

    // Listen for actions from the server
    socket.on('action', (data) => {
      console.log(`Received action from ${data.username || 'Unknown'}:`, data.action);
      switch (data.action.type) {
        case 'URL_CHANGE':
          setPlayerUrl(data.action.url);
          setPlaying(true); // Autoplay when URL changes
          setPlayed(0); // Reset played progress
          break;
        case 'PLAY':
          setPlaying(true);
          break;
        case 'PAUSE':
          setPlaying(false);
          break;
        case 'SEEK':
          if (playerRef.current) {
            playerRef.current.seekTo(data.action.time);
            setPlayed(data.action.time);
          }
          break;
        default:
          break;
      }
    });

    socket.on('user_joined', ({ username: joinedUsername, users: currentUsers }) => {
      console.log(`${joinedUsername} joined the room.`);
      console.log('Current users received from server:', currentUsers); // Added for debugging
      setUsers(currentUsers);
    });

    socket.on('user_left', ({ username: leftUsername, users: currentUsers }) => {
      console.log(`${leftUsername} left the room.`);
      setUsers(currentUsers);
    });

    // Clean up socket listener when component unmounts
    return () => {
      socket.off('action');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [room, username]); // Re-run effect if room or username changes

  const handleLoadClick = () => {
    console.log(`${username} attempting to load URL: ${inputUrl}`);
    // Emit URL_CHANGE action to the server, including username
    socket.emit('action', { room, username, action: { type: 'URL_CHANGE', url: inputUrl } });
    // Update local state immediately for responsiveness
    setPlayerUrl(inputUrl);
    setPlaying(true);
    setPlayed(0);
  };

  const handlePlayerReady = () => {
    console.log('ReactPlayer is ready!');
    // When player is ready, if there's a current time from server, seek to it
    // This handles initial sync for new joiners
    if (playerRef.current && playerUrl && playerRef.current.getCurrentTime() !== played) {
      playerRef.current.seekTo(played);
    }
  };

  const handlePlay = () => {
    console.log(`${username} playing video`);
    // Emit PLAY action to the server, including username
    socket.emit('action', { room, username, action: { type: 'PLAY' } });
    setPlaying(true);
  };

  const handlePause = () => {
    console.log(`${username} paused video`);
    // Emit PAUSE action to the server, including username
    socket.emit('action', { room, username, action: { type: 'PAUSE' } });
    setPlaying(false);
  };

  const handleProgress = (state) => {
    // Only emit seek if not currently seeking (dragging the slider)
    // and if there's a significant difference to prevent excessive emissions
    if (!seeking && Math.abs(state.playedSeconds - played) > 1) {
      socket.emit('action', { room, username, action: { type: 'SEEK', time: state.playedSeconds } });
      setPlayed(state.playedSeconds);
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    const time = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      socket.emit('action', { room, username, action: { type: 'SEEK', time } });
      setPlayed(time);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '10px' }}>Video Player - Room: {room}</h2>
      <p>Logged in as: <strong>{username}</strong></p>
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
        fontSize: '0.8em',
        zIndex: 1000 // Ensure it's above other content
      }}>
        <strong>Users in Room:</strong>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {users.map(user => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)} 
          placeholder="Paste a YouTube URL here" 
          style={{ width: '520px', padding: '10px', fontSize: '14px' }}
        />
        <button 
          onClick={handleLoadClick} 
          style={{ padding: '10px 20px', fontSize: '14px' }}
          disabled={!inputUrl}
        >
          Load
        </button>
      </div>

      <div style={{ 
        position: 'relative', 
        width: '640px', 
        height: '360px',
        background: '#000' 
      }}>
        {playerUrl ? (
          <ReactPlayer
            key={playerUrl}
            ref={playerRef}
            url={playerUrl}
            playing={playing}
            controls={true}
            width='100%'
            height='100%'
            onReady={handlePlayerReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onProgress={handleProgress}
            onError={e => console.error('ReactPlayer Error:', e)}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: '#222'
          }}>
            <p>Paste a URL above and click "Load" to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
