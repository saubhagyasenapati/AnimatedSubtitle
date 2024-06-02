import React, { useEffect, useState } from 'react';

const Subtitle = ({ content, startTime, endTime, currentTime, currentIndex, theme, dimensions, primaryColor, secondaryColor, fontSize, yPosition }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const color = currentIndex % 2 === 0 ? primaryColor : secondaryColor;
  const duration = parseFloat(endTime) - parseFloat(startTime);

  useEffect(() => {
    if (currentTime >= startTime && currentTime <= endTime) {
      fetch(`/themes/${theme}.html`)
        .then(response => response.text())
        .then(themeContent => {
          const cssVariables = `
            --font-size: ${fontSize || '70px'};
            --primary-color: ${primaryColor || 'green'};
            --highlight-color: ${secondaryColor || 'yellow'};
            --animation-duration: ${duration}s;
            --y-position: ${yPosition !== undefined ? `calc(50% + ${yPosition}px)` : '50%'};
          `;

          const updatedContent = themeContent
            .replace('/* CSS_VARIABLES */', cssVariables)
            .replace('Placeholder', content);

          setHtmlContent(updatedContent);
        });
    } else {
      setHtmlContent(''); // Clear content when subtitle is not active
    }
  }, [content, primaryColor, secondaryColor, fontSize, yPosition, duration, theme, currentTime, startTime, endTime]);

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
