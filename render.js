// import fs from 'fs';
// import puppeteer from 'puppeteer';
// import { exec } from 'child_process';
// import { setTimeout } from 'timers/promises';

// import transcription from './src/assets/transcription.json' assert { type: 'json' };


// async function renderSubtitles() {
//   console.log('Rendering subtitles onto frames...');
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Ensure that the frames directory exists
//   if (!fs.existsSync('frames')) {
//     fs.mkdirSync('frames');
//   }

//   // Iterate through each subtitle
//   for (let i = 0; i < transcription.length; i++) {
//     const subtitle = transcription[i];
//     const frameNumber = i + 1;

//     // Load HTML/CSS content onto the page
//     const htmlContent = `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${subtitle.content}</div>`;
//     await page.setContent(`<html><body style="margin: 0; padding: 0;">${htmlContent}</body></html>`);

//     // Wait for a specified amount of time
//     await setTimeout(3000);

//     // Capture screenshot of the page
//     const screenshot = await page.screenshot({ type: 'png' });

//     // Save the screenshot as an image file
//     fs.writeFileSync(`frames/frame${frameNumber.toString().padStart(4, '0')}.png`, screenshot);

//     console.log(`Frame ${frameNumber} rendered.`);
//   }

//   console.log('Rendering subtitles completed.');
//   await browser.close();
// }

// function combineFramesIntoVideo() {
//   console.log('Combining frames into video using FFmpeg...');
//   const command = `ffmpeg -r 30 -f image2 -s 1920x1080 -i frames/frame%04d.png -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1" -c:v libx264 -crf 25 -pix_fmt yuv420p output_video.mp4
//   `;

//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.error('Error executing FFmpeg command:', error);
//       return;
//     }
//     console.log('FFmpeg command output:', stdout);
//     console.error('FFmpeg command errors:', stderr);
//   });
// }

// async function main() {
//   // Step 1: Render subtitles onto frames
//   await renderSubtitles();

//   // Step 2: Combine frames into video using FFmpeg
//   combineFramesIntoVideo();
// }

// main();


import fs from 'fs';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { setTimeout } from 'timers/promises';
import transcription from './src/assets/transcription.json' assert { type: 'json' };
import 'animate.css';

function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -i ${videoPath} -hide_banner 2>&1 | grep 'Duration\\|fps\\|Video'`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error getting video metadata: ${stderr}`);
        return;
      }

      const durationMatch = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      const fpsMatch = stdout.match(/(\d+(\.\d+)?) fps/);
      const resolutionMatch = stdout.match(/, (\d+)x(\d+)/);

      if (durationMatch && fpsMatch && resolutionMatch) {
        const hours = parseFloat(durationMatch[1]);
        const minutes = parseFloat(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        const duration = hours * 3600 + minutes * 60 + seconds;
        const frameRate = parseFloat(fpsMatch[1]);
        const width = parseInt(resolutionMatch[1]);
        const height = parseInt(resolutionMatch[2]);

        resolve({ duration, frameRate, width, height });
      } else {
        reject('Failed to parse video metadata');
      }
    });
  });
}

// async function renderSubtitles(videoMetadata) {
//   console.log('Rendering subtitles onto frames...');
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Ensure that the frames directory exists
//   if (!fs.existsSync('frames')) {
//     fs.mkdirSync('frames');
//   }

//   const { duration, frameRate, width, height } = videoMetadata;
//   const totalFrames = duration * frameRate;

//   // Set viewport size based on video resolution
//   await page.setViewport({ width, height });

//   // Generate a mapping of content to alternating colors
//   const contentColors = {};
//   let colorIndex = 0;
//   const colors = ['red', 'yellow']; // Add more colors if needed
//   transcription.forEach((subtitle) => {
//     if (!contentColors[subtitle.content]) {
//       contentColors[subtitle.content] = colors[colorIndex];
//       colorIndex = (colorIndex + 1) % colors.length;
//     }
//   });

//   for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
//     const currentTime = frameNumber / frameRate;

//     const currentSubtitle = transcription.find((subtitle) => {
//       return (
//         subtitle &&
//         currentTime >= parseFloat(subtitle.start_time) &&
//         currentTime <= parseFloat(subtitle.end_time)
//       );
//     });

//     // Assign color based on content
//     const color = contentColors[currentSubtitle ? currentSubtitle.content : ''] || 'white';

//     // Load HTML/CSS content onto the page
//     const htmlContent = `
//     <html>
//     <head>
//       <style>
//         body {
//           margin: 0;
//           padding: 0;
//           width: 100%;
//           height: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: center;
          
//           background: transparent;
//         }
//         .subtitle {
//           font-size: 70px;
//           font-weight: 900;
//           text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.7);
//           animation: fadeInOut 3s linear;
//           color: ${color};
//         }
//       </style>
//     </head>
//     <body>
//       <div class="subtitle">${currentSubtitle ? currentSubtitle.content : ''}</div>
//     </body>
//   </html>
//     `;
//     await page.setContent(htmlContent);

//     // Wait for a specified amount of time
//     await setTimeout(1000 / frameRate); // Based on the frame rate

//     // Capture screenshot of the page
//     const screenshot = await page.screenshot({ type: 'png', omitBackground: true });

//     // Save the screenshot as an image file
//     fs.writeFileSync(`frames/frame${frameNumber.toString().padStart(6, '0')}.png`, screenshot);

//     console.log(`Frame ${frameNumber} rendered.`);
//   }

//   console.log('Rendering subtitles completed.');
//   await browser.close();
// }

async function renderSubtitles(videoMetadata) {
  console.log('Rendering subtitles onto frames...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Ensure that the frames directory exists
  if (!fs.existsSync('frames')) {
    fs.mkdirSync('frames');
  }

  const { duration, frameRate, width, height } = videoMetadata;
  const totalFrames = duration * frameRate;

  // Set viewport size based on video resolution
  await page.setViewport({ width, height });

  // Generate a mapping of content to alternating colors
  const contentColors = {};
  let colorIndex = 0;
  const colors = ['red', 'yellow']; // Add more colors if needed
  transcription.forEach((subtitle) => {
    if (!contentColors[subtitle.content]) {
      contentColors[subtitle.content] = colors[colorIndex];
      colorIndex = (colorIndex + 1) % colors.length;
    }
  });

  let currentSubtitleIndex = 0;
  let currentSubtitle = transcription[currentSubtitleIndex];
  let subtitleStartFrame = Math.floor(parseFloat(currentSubtitle.start_time) * frameRate);
  let subtitleEndFrame = Math.floor(parseFloat(currentSubtitle.end_time) * frameRate);

  for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
    const currentTime = frameNumber / frameRate;

    if (frameNumber > subtitleEndFrame && currentSubtitleIndex < transcription.length - 1) {
      currentSubtitleIndex++;
      currentSubtitle = transcription[currentSubtitleIndex];
      subtitleStartFrame = Math.floor(parseFloat(currentSubtitle.start_time) * frameRate);
      subtitleEndFrame = Math.floor(parseFloat(currentSubtitle.end_time) * frameRate);
    }

    // Assign color based on content
    const color = contentColors[currentSubtitle ? currentSubtitle.content : ''] || 'white';

    // Load HTML/CSS content onto the page
    const htmlContent = `
      <html>
      <head>
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
            animation: bounce ${currentSubtitle ? (currentSubtitle.end_time - currentSubtitle.start_time) : 3}s linear;
            color: ${color};
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-30px);
            }
            60% {
              transform: translateY(-15px);
            }
          }
          
        </style>
      </head>
      <body>
        <div class="subtitle">${currentSubtitle ? currentSubtitle.content : ''}</div>
      </body>
      </html>
    `;
    await page.setContent(htmlContent);

    // Capture screenshot of the page
    const screenshot = await page.screenshot({ type: 'png', omitBackground: true });

    // Save the screenshot as an image file
    fs.writeFileSync(`frames/frame${frameNumber.toString().padStart(6, '0')}.png`, screenshot);

    console.log(`Frame ${frameNumber} rendered.`);
  }

  console.log('Rendering subtitles completed.');
  await browser.close();
}


// async function renderSubtitles(videoMetadata) {
//   console.log('Rendering subtitles onto frames...');
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Ensure that the frames directory exists
//   if (!fs.existsSync('frames')) {
//     fs.mkdirSync('frames');
//   }
  


//   // Set viewport size based on video resolution
  
//   const { duration, frameRate, width, height } = videoMetadata;
//   const durationPerSubtitle = 3; // Duration of each subtitle in seconds
//   const framesPerSubtitle = durationPerSubtitle * frameRate;
//   const totalFrames = transcription.length * framesPerSubtitle;

//   // Set viewport size based on video resolution
//   await page.setViewport({ width, height });

//   for (let i = 0; i < transcription.length; i++) {
//     const subtitle = transcription[i];
//     const frameStart = i * framesPerSubtitle + 1;
//     const frameEnd = frameStart + framesPerSubtitle - 1;

//     // Load HTML/CSS content onto the page
//     const htmlContent = `
//       <html>
//         <head>
//           <style>
//             body {
//               margin: 0;
//               padding: 0;
//               width: 100%;
//               height: 100%;
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               background: transparent;
//             }
//             .subtitle {
//               font-size: 70px;
//               font-weight: 900;
//               text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.7);
//               animation: fadeInOut 3s linear;
//               color: white;
//             }
//             @keyframes fadeInOut {
//               0% { opacity: 0; }
//               50% { opacity: 1; }
//               100% { opacity: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="subtitle">${subtitle.content}</div>
//         </body>
//       </html>
//     `;
//     await page.setContent(htmlContent);

//     for (let frameNumber = frameStart; frameNumber <= frameEnd; frameNumber++) {
//       // Capture screenshot of the page
//       const screenshot = await page.screenshot({ type: 'png' });

//       // Save the screenshot as an image file
//       fs.writeFileSync(`frames/frame${frameNumber.toString().padStart(4, '0')}.png`, screenshot);

//       console.log(`Frame ${frameNumber} rendered.`);
//     }
//   }

//   console.log('Rendering subtitles completed.');
//   await browser.close();
// }


function combineFramesIntoVideo() {
  console.log('Combining frames into video using FFmpeg...');
  // const command = `ffmpeg -i public/Video.mp4 -r 30 -f image2 -i frames/frame%06d.png -filter_complex "[0:v][1:v] overlay=0:0" -c:v libx264 -crf 25 -pix_fmt yuv420p output_video.mp4`;
 const command=`ffmpeg -i public/Video.mp4 -r 30 -f image2 -i frames/frame%06d.png -filter_complex "[0:v][1:v] overlay=0:0" -c:v libx264 -crf 25 -pix_fmt yuv420p VideoOutput/output_video.mp4`
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing FFmpeg command:', error);
      return;
    }
    console.log('FFmpeg command output:', stdout);
    console.error('FFmpeg command errors:', stderr);
  });
}

async function main() {
  try {
    const videoPath = 'public/Video.mp4';
    const videoMetadata = await getVideoMetadata(videoPath);

    // Step 1: Render subtitles onto frames
    await renderSubtitles(videoMetadata);

    // Step 2: Combine frames into video using FFmpeg
    combineFramesIntoVideo();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
