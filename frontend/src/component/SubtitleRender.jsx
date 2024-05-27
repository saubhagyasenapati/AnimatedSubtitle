import React, { useState, useEffect, useRef } from "react";
import Subtitle from "./Subtitle";
import "../App.css";

const themes = ["theme1", "theme2", "theme3",'theme4']; 

const SubtitleRender= ({uploadedVideoUrl,captionApplied,transcription}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [file, setFile] = useState(null);

  const [theme, setTheme] = useState(themes[0]);
  const videoRef = useRef(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    const index = transcription.findIndex((subtitle) => {
      return (
        subtitle &&
        currentTime >= parseFloat(subtitle.start_time) &&
        currentTime <= parseFloat(subtitle.end_time)
      );
    });
    setCurrentSubtitleIndex(index);
  }, [currentTime]);



  return (
    <div className="app-container">
     
          <div>
            <video
              className="video-player"
              src={uploadedVideoUrl}
              autoPlay
              controls
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
            ></video>
            {!captionApplied && currentSubtitleIndex !== -1 && (
              <Subtitle
                content={transcription[currentSubtitleIndex].content}
                currentIndex={currentSubtitleIndex}
              />
            )}
          </div>
    </div>
  );
};

export default SubtitleRender;

