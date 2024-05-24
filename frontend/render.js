
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { setTimeout } from 'timers/promises';
import transcription from './src/assets/transcription.json' assert { type: 'json' };
import { v4 as uuidv4 } from 'uuid';

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

    if (frameNumber >= subtitleEndFrame && currentSubtitleIndex < transcription.length - 1) {
      currentSubtitleIndex++;
      currentSubtitle = transcription[currentSubtitleIndex];
      subtitleStartFrame = Math.floor(parseFloat(currentSubtitle.start_time) * frameRate);
      subtitleEndFrame = Math.floor(parseFloat(currentSubtitle.end_time) * frameRate);
    }

    // Assign color based on content
    const color = contentColors[currentSubtitle ? currentSubtitle.content : ''] || 'white';

    // Calculate animation duration
    const animationDuration = currentSubtitle ? (parseFloat(currentSubtitle.end_time) - parseFloat(currentSubtitle.start_time)) : 3;

    // Load HTML/CSS content onto the page
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
            animation: ${currentSubtitle ? `swing ${animationDuration}s ease-in-out` : 'none'};
            color: ${color};
          }
          .subtitle-text {
            -webkit-text-stroke: 1.5px black;
            text-shadow: 0 0 4px white; 
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
      ${(
        currentSubtitle &&                    
        frameNumber >= subtitleStartFrame &&  
        frameNumber <= subtitleEndFrame      
      ) ? `
        <span class="subtitle-text">${currentSubtitle.content}</span>` : 
        ''                                    
      }
    </div>
    
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




function combineFramesIntoVideo(videoPath) {
  console.log('Combining frames into video using FFmpeg...');

  // Generate a UUID
  const uniqueId = uuidv4();

  // Get the current date and time
  const now = new Date();
  const formattedDateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;
  console.log(formattedDateTime);
  

  // Create the output directory if it doesn't exist
  // const outputDir = path.join(__dirname, 'VideoOutput');
  // if (!fs.existsSync(outputDir)) {
  //   fs.mkdirSync(outputDir);
  // }

  // Construct the output filename
  const outputFilename = `output_video_${uniqueId}_${formattedDateTime}.mp4`;


  // FFmpeg command
  const command = `ffmpeg -i ${videoPath} -r 30 -f image2 -i frames/frame%06d.png -filter_complex "[0:v][1:v] overlay=0:0" -c:v libx264 -crf 25 -pix_fmt yuv420p VideoOutput/${outputFilename}`;

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
    combineFramesIntoVideo(videoPath);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
