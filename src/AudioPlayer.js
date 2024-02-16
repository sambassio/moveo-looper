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
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const totalDurationRef = useRef(18); // Assuming a fixed total duration for simplicity
    const playingRef = useRef(false);
    const containerRef = useRef(null); // For calculating cursor position within the container
    const startTimeRef = useRef(null); // Missing ref definition added here
    const animationRef = useRef(null); // To manage requestAnimationFrame for cursor updates


  useEffect(() => {
    const ac = new AudioContext();
    setAudioContext(ac);
    loadAudioFiles(ac);

    return () => ac.close();
  }, []);

  const loadAudioFiles = async (ac) => {
    const buffers = await Promise.all(audioFiles.map(async (file) => {
      const response = await fetch(file);
      const arrayBuffer = await response.arrayBuffer();
      return await ac.decodeAudioData(arrayBuffer);
    }));

    setTracks(buffers.map((buffer, index) => ({
      id: index,
      audioBuffer: buffer,
      isMuted: false,
      gainNode: ac.createGain(),
    })));
  };

  const playAllAudio = () => {
    if (!playingRef.current && audioContext) {
      playingRef.current = true;
      setIsPlaying(true);
      tracks.forEach(track => {
        const source = audioContext.createBufferSource();
        source.buffer = track.audioBuffer;
        source.loop = isLooping;
        source.connect(track.gainNode);
        track.gainNode.connect(audioContext.destination);
        track.gainNode.gain.value = track.isMuted ? 0 : 1;
        source.start(0, cursorPosition / 100 * totalDurationRef.current);
        track.source = source;
      });
      requestAnimationFrame(updateCursorPosition);
    }
  };

  const stopAllAudio = () => {
    if (playingRef.current) {
      tracks.forEach(track => {
        if (track.source) {
          track.source.stop();
          delete track.source;
        }
      });
      playingRef.current = false;
      setIsPlaying(false);
    }
  };

  const toggleLoop = () => setIsLooping(!isLooping);

  const toggleMute = (id) => {
    setTracks(tracks.map(track => {
      if (track.id === id) {
        track.isMuted = !track.isMuted;
        track.gainNode.gain.value = track.isMuted ? 0 : 1;
      }
      return track;
    }));
  };

  const updateCursorPosition = () => {
    if (!playingRef.current || !audioContext) return;
    const elapsedTime = audioContext.currentTime % totalDurationRef.current;
    const position = (elapsedTime / totalDurationRef.current) * 100;
    setCursorPosition(position);
    requestAnimationFrame(updateCursorPosition);
  };

  // Drag-and-drop functionality
  const handleMouseDown = (e) => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const bounds = containerRef.current.getBoundingClientRect();
    const position = ((e.clientX - bounds.left) / bounds.width) * 100;
    setCursorPosition(Math.max(0, Math.min(100, position))); // Clamp position between 0 and 100
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Calculate and set the new playback position
    const newTime = (cursorPosition / 100) * totalDurationRef.current;
    if (isPlaying) {
      playAllAudioFromTime(newTime);
    }
  };

  const playAllAudioFromTime = (startTime) => {
    stopAllAudio(); // First, stop all currently playing tracks
    playingRef.current = true;
    setIsPlaying(true);
    tracks.forEach(track => {
      const source = audioContext.createBufferSource();
      source.buffer = track.audioBuffer;
      source.loop = isLooping;
      source.connect(track.gainNode);
      track.gainNode.connect(audioContext.destination);
      track.gainNode.gain.value = track.isMuted ? 0 : 1;
      source.start(0, startTime % source.buffer.duration);
      track.source = source;
    });
    startTimeRef.current = audioContext.currentTime - startTime;
    requestAnimationFrame(updateCursorPosition);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%' }} onMouseDown={handleMouseDown}>
      <button onClick={playAllAudio}>{isPlaying ? "⏸ Pause" : "▶️ Play All"}</button>
      <button onClick={stopAllAudio}>⏹️ Stop All</button>
      <button onClick={toggleLoop}>{isLooping ? "🔄 Loop ON" : "🔄 Loop OFF"}</button>
      {tracks.map((track, index) => (
        <div key={index} style={{ backgroundColor: rowColors[index], padding: '10px', marginBlock: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <span style={{ color: '#282c34' }}>{audioFiles[index].split('/').pop().replace('.mp3', '')}</span>
          <button onClick={() => toggleMute(track.id)}>
            {track.isMuted ? "🔇 Mute" : "🔊 Unmute"}
          </button>
          <div className="cursor" style={{ left: `${cursorPosition}%`, width: '2px', height: '100%', position: 'absolute', backgroundColor: 'red' }}></div>
        </div>
      ))}
    </div>
  );
};

export default AudioPlayer;
