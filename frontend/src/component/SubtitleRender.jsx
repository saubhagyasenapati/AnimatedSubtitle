import React, { useState, useEffect, useRef } from "react";
import Subtitle from "./Subtitle";
import "../App.css";
import transcription from "../assets/transcription2.json";

const App = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [loading,setLoading]=useState(false)
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [captionApplied, setCaptionApplied] = useState(false);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setFile(file);
    const formData = new FormData();
    formData.append("video", file);
    const fileUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(fileUrl);
  };

  const handleApplyCaption = async () => {
    const formData = new FormData();
    formData.append("video", file);
     setLoading(true);
    const transcriptionFile = new File(
      [JSON.stringify(transcription)],
      "transcription.json",
      {
        type: "application/json",
      }
    );
    formData.append("transcription", transcriptionFile);

    try {
      const response = await fetch("http://localhost:3001/apply-caption", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUploadedVideoUrl(data.url);
        setCaptionApplied(true);
        setLoading(false)
      } else {
        // Handle caption application error
      }
    } catch (error) {
      console.error("Error applying caption:", error);
    }
  };

  return (
    <div className="app-container">
      <div className="video-container">
        <input type="file" onChange={handleFileUpload} />
        {uploadedVideoUrl && (
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
        )}
        <button
          className="apply-caption-btn"
          onClick={handleApplyCaption}
          disabled={!file||loading}
      
        >
          Apply Caption
        </button>
      </div>
    </div>
  );
};

export default App;
