import React, { useState, useEffect, useRef } from 'react';

const audioFiles = [
  "/audio/all.mp3",
  "/audio/b_voc.mp3",
  "/audio/drums.mp3",
  "/audio/he_voc.mp3",
  "/audio/high_voc.mp3",
  "/audio/jibrish.mp3",
  "/audio/lead.mp3",
  "/audio/tambourine.mp3",
  "/audio/uuho_voc.mp3",
];

const rowColors = [
  "#FFADAD",
  "#FFD6A5",
  "#FDFFB6",
  "#CAFFBF",
  "#9BF6FF",
  "#A0C4FF",
  "#BDB2FF",
  "#FFC6FF",
  "#FFFFFC",
];

const AudioPlayer = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLooping, setIsLooping] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const playingRef = useRef(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalDurationRef = useRef(18); // Assuming a fixed duration for simplicity

  useEffect(() => {
    const context = new AudioContext();
    setAudioContext(context);
    loadAudioFiles(context, audioFiles);

    return () => {
      context.close();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadAudioFiles = async (context, files) => {
    const audioBuffers = await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        return await context.decodeAudioData(arrayBuffer);
      })
    );

    setTracks(audioBuffers.map((buffer, index) => ({
      id: index,
      audioBuffer: buffer,
      isMuted: false,
      gainNode: context.createGain(),
    })));
  };

  const playAllAudio = () => {
    if (!playingRef.current && audioContext) {
      playingRef.current = true;
      tracks.forEach(track => {
        // Setup and play tracks...
        track.source = audioContext.createBufferSource();
        track.source.buffer = track.audioBuffer;
        track.source.loop = isLooping;
        track.source.connect(track.gainNode);
        track.gainNode.connect(audioContext.destination);
        track.source.start();
      });

      startTimeRef.current = audioContext.currentTime;
      setCursorPosition(0); // Reset cursor position at start
      requestAnimationFrame(updateCursorPosition);
    }
  };

  const stopAllAudio = () => {
    if (playingRef.current) {
      tracks.forEach(track => {
        if (track.source) {
          track.source.stop();
          delete track.source; // Clean up the source
        }
      });
      playingRef.current = false;
      cancelAnimationFrame(animationRef.current);
      setCursorPosition(0); // Reset cursor position
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    tracks.forEach(track => {
      if (track.source) {
        track.source.loop = !isLooping;
      }
    });
  };

  const toggleMute = (trackId) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        track.isMuted = !track.isMuted;
        track.gainNode.gain.value = track.isMuted ? 0 : 1;
      }
      return track;
    }));
  };

  const updateCursorPosition = () => {
    if (!playingRef.current || !audioContext) return;

    const elapsedTime = audioContext.currentTime - startTimeRef.current;
    let position = (elapsedTime / totalDurationRef.current) * 100;

    if (!isLooping && elapsedTime >= totalDurationRef.current) {
      playingRef.current = false; // Stop playing
      cancelAnimationFrame(animationRef.current); // Stop cursor update
      position = 100; // Set cursor to the end
    } else if (isLooping) {
      position = position % 100; // Keep the cursor within 0-100% range
    }

    setCursorPosition(position);
    if (playingRef.current) {
      animationRef.current = requestAnimationFrame(updateCursorPosition);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <button onClick={playAllAudio}>▶️ Play All</button>
      <button onClick={stopAllAudio}>⏹️ Stop All</button>
      <button onClick={toggleLoop}>{isLooping ? "🔄 Loop: ON" : "🔄 Loop: OFF"}</button>
      {tracks.map((track, index) => (
        <div key={index} style={{ backgroundColor: rowColors[index], padding: '10px', marginBlock: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span style={{ color: '#282c34' }}>Track {index + 1}</span>
          <button onClick={() => toggleMute(track.id)}>
            {track.isMuted ? "🔇" : "🔊"}
          </button>
          {/* Individual cursor for each track */}
          <div className="cursor" style={{ left: `${cursorPosition}%`, width: '2px', height: '100%', position: 'absolute', backgroundColor: 'red' }}></div>
        </div>
      ))}
    </div>
  );
};

export default AudioPlayer;
