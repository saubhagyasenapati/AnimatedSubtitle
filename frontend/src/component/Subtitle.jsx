import React, { useEffect, useState } from 'react';

const Subtitle = ({ content, startTime, endTime, currentTime, currentIndex, theme, dimensions }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const color = currentIndex % 2 === 0 ? 'red' : 'yellow';
  const duration = parseFloat(endTime) - parseFloat(startTime);

  useEffect(() => {
    if (currentTime >= startTime && currentTime <= endTime) {
      fetch(`/themes/${theme}.html`)
        .then(response => response.text())
        .then(themeContent => {
          const updatedContent = themeContent
            .replace('Placeholder', content)
            .replace('green', color)
            .replace('3s', `${duration}s`);
          setHtmlContent(updatedContent);
        });
    } else {
      setHtmlContent(''); // Clear content when subtitle is not active
    }
  }, [content, color, duration, theme, currentTime, startTime, endTime]);

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
