import React, { useState, useEffect, useRef } from "react";
import SubtitleRender from "./SubtitleRender";
import "../App.css";
import transcription from "../assets/transcription2.json";

const themes = ["theme1", "theme2", "theme3", "theme4"];

const SubtitleContainer = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [captionApplied, setCaptionApplied] = useState(false);
  const [theme, setTheme] = useState(themes[0]); // State to store the selected theme
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
    const fileUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(fileUrl);
  };

  const handleApplyCaption = async () => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("theme", theme); // Include selected theme in form data
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
        setLoading(false);
      } else {
        // Handle caption application error
      }
    } catch (error) {
      console.error("Error applying caption:", error);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setUploadedVideoUrl("");
    setCaptionApplied(false);
  };

  return (
    <div className="app-container">
      <div className="video-container">
        <div className="theme-selection">
          <div>Select Theme:</div>
          <div>
            <select
              className="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!uploadedVideoUrl && (
          <div className="file-upload">
            <input type="file" onChange={handleFileUpload}  />
          </div>
        )}

        {uploadedVideoUrl && <SubtitleRender transcription={transcription} uploadedVideoUrl={uploadedVideoUrl} theme={theme} captionApplied={captionApplied}/>}

        <div className="button-container">
          <button
            className="apply-caption-btn"
            onClick={handleApplyCaption}
            disabled={!file || loading}
          >
            Apply Caption
          </button>
          <button
            className="cancel-btn"
            onClick={handleCancel}
            disabled={!file}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtitleContainer;
