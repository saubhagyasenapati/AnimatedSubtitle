// src/components/Subtitle.js
import React from 'react';
import '../Subtitle.css';

const Subtitle = ({ content, startTime, endTime, currentTime,currentIndex}) => {
  if (currentTime < startTime || currentTime > endTime) return null;
  const color = currentIndex % 2 === 0 ? 'red' : 'yellow';
  return (
    <div className="subtitle">
    <span className="subtitle-text" style={{color}}>{content}</span>
  </div>
  );
};

export default Subtitle;
