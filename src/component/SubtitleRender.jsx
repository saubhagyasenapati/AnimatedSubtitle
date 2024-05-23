// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import Subtitle from "./Subtitle";
import transcription from "../assets/transcription.json"; 
import "../App.css";

const App = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const currentSubtitle = transcription.find((subtitle) => {
    return (
      subtitle &&
      currentTime >= parseFloat(subtitle.start_time) &&
      currentTime <= parseFloat(subtitle.end_time)
    );
  });

  return (
    <div className="App">
      <div className="video-container">
        <video
          src="/Video.mp4"
          autoPlay
          controls
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
        ></video>
        {currentSubtitle && <Subtitle content={currentSubtitle.content} />}
      </div>
    </div>
  );
};

export default App;
