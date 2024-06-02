import React, { useState, useEffect, useRef } from "react";
import Subtitle from "./Subtitle";
import "../App.css";

const themes = ["theme1", "theme2", "theme3", "theme4"];

const SubtitleRender = ({ uploadedVideoUrl, captionApplied, transcription, theme,primaryColor, secondaryColor, fontSize,yPosition}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 360 });

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [uploadedVideoUrl]);

  useEffect(() => {
    const index = transcription.findIndex((subtitle) => {
      return (
        subtitle &&
        currentTime >= parseFloat(subtitle.start_time) &&
        currentTime <= parseFloat(subtitle.end_time)
      );
    });
    setCurrentSubtitleIndex(index);
  }, [currentTime, transcription]);

  return (
    <div
      className="app-container"
      ref={containerRef}
      style={{ position: "relative", width: videoDimensions.width, height: videoDimensions.height }}
    >
      <video
        className="video-player"
        src={uploadedVideoUrl}
        autoPlay
        controls
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        style={{ width: '100%', height: '100%' }}
      ></video>
      {!captionApplied && currentSubtitleIndex !== -1 && (
        <Subtitle
          content={transcription[currentSubtitleIndex].content}
          currentIndex={currentSubtitleIndex}
          startTime={transcription[currentSubtitleIndex].start_time}
          endTime={transcription[currentSubtitleIndex].end_time}
          currentTime={currentTime}
          theme={theme}
          dimensions={videoDimensions}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fontSize={fontSize}
          yPosition={yPosition}
        />
      )}
    </div>
  );
};

export default SubtitleRender;
