import React, { useEffect, useState } from 'react';

const Subtitle = ({ content, startTime, endTime, currentTime, currentIndex, theme, dimensions, primaryColor, secondaryColor, fontSize,yPosition}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const color = currentIndex % 2 === 0 ? primaryColor : secondaryColor;
  const duration = parseFloat(endTime) - parseFloat(startTime);

  useEffect(() => {
    if (currentTime >= startTime && currentTime <= endTime) {
      fetch(`/themes/${theme}.html`)
      .then(response => response.text())
      .then(themeContent => {
        const updatedContent = themeContent
          .replace('--primary-color: green;', `--primary-color: ${primaryColor};`)
          .replace('--secondary-color: yellow;', `--secondary-color: ${secondaryColor};`)
          .replace('--font-size: 70px;', `--font-size: ${fontSize};`)
          .replace('--y-position: 50%;', `--y-position: calc(50% + ${yPosition}px);`)
          .replace('Placeholder',content);
        setHtmlContent(updatedContent);
      });
    } else {
        setHtmlContent(''); // Clear content when subtitle is not active
    }
}, [content, primaryColor, duration, theme, currentTime, startTime, endTime, fontSize, secondaryColor,yPosition]);


  if (currentTime < startTime || currentTime > endTime) return null;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Subtitle;
