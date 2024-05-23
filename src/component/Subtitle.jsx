// src/components/Subtitle.js
import React from 'react';
import '../Subtitle.css';

const Subtitle = ({ content, startTime, endTime, currentTime }) => {
  if (currentTime < startTime || currentTime > endTime) return null;

  return (
    <div className="subtitle">
      {content}
    </div>
  );
};

export default Subtitle;
