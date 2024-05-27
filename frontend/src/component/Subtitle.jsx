// // src/components/Subtitle.js
// import React from 'react';
// import '../Subtitle.css';

// const Subtitle = ({ content, startTime, endTime, currentTime,currentIndex}) => {
//   if (currentTime < startTime || currentTime > endTime) return null;
//   const color = currentIndex % 2 === 0 ? 'red' : 'yellow';
//   return (
//     <div className="subtitle">
//     <span className="subtitle-text" style={{color}}>{content}</span>
//   </div>
//   );
// };

// export default Subtitle;
import React from 'react';

const Subtitle = ({ content, startTime, endTime, currentTime, currentIndex }) => {
  if (currentTime < startTime || currentTime > endTime) return null;

  // Calculate the duration in seconds
  const duration = parseFloat(endTime) - parseFloat(startTime);
  const color = currentIndex % 2 === 0 ? 'red' : 'yellow';
  // Dynamically generate the HTML with the calculated duration
  const htmlContent = `
    <html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
          }
          .subtitle {
            font-size: 70px;
            font-weight: 900;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.7);
            animation: swing 3s ease-in-out; // Use the duration in the animation property
          }
          .subtitle-text {
            -webkit-text-stroke: 1.5px black;
            text-shadow: 0 0 4px white;
            color: ${color};
          }
          @keyframes swing {
            20% {
              transform: rotate3d(0, 0, 1, 15deg);
            }
            40% {
              transform: rotate3d(0, 0, 1, -10deg);
            }
            60% {
              transform: rotate3d(0, 0, 1, 5deg);
            }
            80% {
              transform: rotate3d(0, 0, 1, -5deg);
            }
            100% {
              transform: rotate3d(0, 0, 1, 0deg);
            }
          }
        </style>
      </head>
      <body>
        <div class="subtitle">
          <span class="subtitle-text">${content}</span>
        </div>
      </body>
    </html>
  `;

  // Render the HTML content
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default Subtitle;


