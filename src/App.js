import React from 'react';
import './App.css';
import AudioPlayer from './AudioPlayer'; // Import the AudioPlayer component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <AudioPlayer /> {/* Use the AudioPlayer component */}
      </header>
    </div>
  );
}

export default App;
