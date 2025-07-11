import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import YouTubePlayer from './YouTubePlayer';

const socket = io('http://localhost:3001');

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get('username') || 'Guest';
  const [urlToLoad, setUrlToLoad] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  

  

  useEffect(() => {
    console.log("Socket connected status:", socket.connected);
    console.log("Socket ID:", socket.id);
    socket.emit('join-room', roomId, username);

    socket.on('video-event', (data) => {
      console.log('Received video-event from server:', data);
      if (data.type === 'play') {
        setPlaying(true);
      } else if (data.type === 'pause') {
        setPlaying(false);
      } else if (data.type === 'seek') {
        // playerRef.current.seekTo(data.time); // Handled by YouTubePlayer internally
      } else if (data.type === 'load') {
        setVideoUrl(data.url);
        setPlaying(false); // Pause on load
      } else if (data.type === 'sync-play-state') {
        setPlaying(data.playing);
      }
    });

    socket.on('chat-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // socket.on('voice-activity', (data) => {
    //   if (data.isSpeaking) {
    //     setPlaying(false);
    //     socket.emit('video-event', { room: roomId, type: 'pause' });
    //   }
    // });

    // setupVoiceActivityDetection();

    return () => {
      socket.off('video-event');
      socket.off('chat-message');
    };
  }, [roomId]);

  const handleLoadVideo = () => {
    console.log("Loading video with URL:", urlToLoad);
    socket.emit('video-event', { room: roomId, type: 'load', url: urlToLoad });
  };

  const handlePlay = () => {
    console.log("ReactPlayer: onPlay triggered");
    setPlaying(true);
    socket.emit('video-event', { room: roomId, type: 'play' });
  };

  const handlePause = () => {
    console.log("ReactPlayer: onPause triggered");
    setPlaying(false);
    socket.emit('video-event', { room: roomId, type: 'pause' });
  };

  const handleSendMessage = () => {
    if (message) {
      const data = { room: roomId, message, username };
      socket.emit('chat-message', data);
      setMessage('');
    }
  };

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Video URL"
          name="videoUrl"
          value={urlToLoad}
          onChange={(e) => setUrlToLoad(e.target.value)}
        />
        <button onClick={handleLoadVideo}>Load Video</button>
      </div>
      <p>Current Video URL: {videoUrl}</p>
      {videoUrl && (
        <YouTubePlayer
          videoId={videoUrl.split('v=')[1].substring(0, 11)} // Extract YouTube video ID
          playing={playing}
          onReady={() => console.log("YouTubePlayer: Ready!")}
          onPlay={() => console.log("YouTubePlayer: Playing!")}
          onPause={() => console.log("YouTubePlayer: Paused!")}
        />
      )}
      {isAdmin && (
        <>
          <div>
            <button onClick={() => socket.emit('video-event', { room: roomId, type: 'play' })}>Play</button>
            <button onClick={() => socket.emit('video-event', { room: roomId, type: 'pause' })}>Pause</button>
          </div>
        </>
      )}
      <div>
        <h2>Chat</h2>
        <div>
          {messages.map((msg, index) => (
            <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
          ))}
        </div>
        <input
          type="text"
          name="chatMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Room;
