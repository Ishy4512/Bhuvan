import React, { useEffect, useRef, useState } from 'react';

const YouTubePlayer = ({ videoId, playing, onReady, onPlay, onPause }) => {
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    const initializePlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
        videoId: videoId,
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            onReady && onReady(event);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay && onPlay(event);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              onPause && onPause(event);
            }
          },
        },
      });
    };

    if (!window.YT || !window.YT.Player) {
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return <div id={`youtube-player-${videoId}`} style={{ width: '100%', height: '400px' }}></div>;
};

export default YouTubePlayer;
