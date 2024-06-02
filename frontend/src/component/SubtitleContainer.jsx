import React, { useState, useEffect, useRef } from "react";
import SubtitleRender from "./SubtitleRender";
import "../App.css";
import transcription from "../assets/transcription.json";

const themes = ["theme1", "theme2", "theme3", "theme4"];

const SubtitleContainer = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [captionApplied, setCaptionApplied] = useState(false);
  const [theme, setTheme] = useState(themes[0]);
  const [primaryColor, setPrimaryColor] = useState("#00FF00"); // Default green
  const [secondaryColor, setSecondaryColor] = useState("#FFFF00"); // Default yellow
  const [fontSize, setFontSize] = useState("70px");
  const [yPosition, setYPosition] = useState("0"); // Default center
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
    formData.append("theme", theme);
    formData.append("primaryColor", primaryColor);
    formData.append("secondaryColor", secondaryColor);
    formData.append("fontSize", fontSize);
    formData.append("yPosition", yPosition);
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
      } else {
        // Handle caption application error
        console.error("Caption application failed:", response.statusText);
      }
    } catch (error) {
      // Handle fetch error
      console.error("Error applying caption:", error);
    } finally {
      // Always set loading state to false after request completes
      setLoading(false);
    }
  };
  

  const handleCancel = () => {
    setFile(null);
    setLoading(false);
    setUploadedVideoUrl("");
    setCaptionApplied(false);
  };

  return (
    <div className="app-container">
      <div className="video-container">
        <div className="theme-selection">
          <div>Select Theme:</div>
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

        <div className="color-selection">
          <div>
            <label htmlFor="primary-color">Primary Color:</label>
            <input
              type="color"
              id="primary-color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="secondary-color">Secondary Color:</label>
            <input
              type="color"
              id="secondary-color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
            />
          </div>
        </div>

        <div className="font-size-selection">
          <label htmlFor="font-size">Font Size:</label>
          <input
            type="text"
            id="font-size"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          />
        </div>

        <div className="y-position-selection">
          <label htmlFor="y-position">Vertical Position:</label>
          <input
            type="number"
            id="y-position"
            value={yPosition}
            onChange={(e) => setYPosition(e.target.value)}
          />
        </div>

        {!uploadedVideoUrl && (
          <div className="file-upload">
            <input type="file" onChange={handleFileUpload} />
          </div>
        )}

        {uploadedVideoUrl && (
          <SubtitleRender
            transcription={transcription}
            uploadedVideoUrl={uploadedVideoUrl}
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            fontSize={fontSize}
            yPosition={yPosition}
            captionApplied={captionApplied}
          />
        )}

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
