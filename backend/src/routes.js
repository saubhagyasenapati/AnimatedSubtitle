import fs from 'fs';
import path from 'path';
import multer from 'multer';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import multiparty from 'multiparty';

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

export const uploadVideo = upload.single('video');

export const uploadHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const videoPath = req.file.path;
  const videoId = path.parse(videoPath).name;

  // Store video path in memory or database (for simplicity, we use memory here)
  videoPaths[videoId] = videoPath;

  res.status(200).send({ videoId });
};


export const processVideo = async (req, res) => {
  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(400).send('Error parsing form data.');
    }

    // Retrieve the video file from the files object
    const videoFile = files.video && files.video[0]; // Multiparty stores files in an array
    if (!videoFile) {
      return res.status(400).send('Video file not provided.');
    }

    // Retrieve the transcription file from the files object
    const transcriptionFile = files.transcription && files.transcription[0]; // Multiparty stores files in an array
    if (!transcriptionFile) {
      return res.status(400).send('Transcription file not provided.');
    }
    console.log(transcriptionFile);
    try {
      // Read the transcription file content
      const transcriptionContent = fs.readFileSync(transcriptionFile.path, 'utf-8');
      // Parse transcription content as JSON
      const transcription = JSON.parse(transcriptionContent);
      
      const videoMetadata = await getVideoMetadata(videoFile.path);
      let videoId=uuidv4();
      await renderSubtitles(videoMetadata, videoFile.path, transcription,videoId);
      const outputUrl = await combineFramesIntoVideo(videoFile.path, videoId);
      res.status(200).send({ url: outputUrl });
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).send('Internal server error.');
    }
  });
};

// Implement the remaining helper functions (getVideoMetadata, renderSubtitles, combineFramesIntoVideo) here

// Video paths storage
const videoPaths = {};

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
  
  async function renderSubtitles(videoMetadata, videoPath, transcription, videoId) {
    console.log('Rendering subtitles onto frames...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Ensure that the frames directory for the current videoId exists
    const framesDirectory = `frames/${videoId}`;
    if (!fs.existsSync(framesDirectory)) {
        fs.mkdirSync(framesDirectory, { recursive: true }); // Create the directory recursively
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

        // Save the screenshot as an image file in the directory with the videoId
        const frameFilePath = path.join(framesDirectory, `frame${frameNumber.toString().padStart(6, '0')}.png`);
        fs.writeFileSync(frameFilePath, screenshot);

        console.log(`Frame ${frameNumber} rendered.`);
    }

    console.log('Rendering subtitles completed.');
    await browser.close();
}

  
function combineFramesIntoVideo(videoPath, videoId) {
    return new Promise((resolve, reject) => {
        console.log('Combining frames into video using FFmpeg...');

        // Get the current date and time
        const now = new Date();
        const formattedDateTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;

        // Construct the output filename
        const outputFilename = `output_video_${videoId}_${formattedDateTime}.mp4`;

        // FFmpeg command
        const command = `ffmpeg -i ${videoPath} -r 30 -f image2 -i frames/${videoId}/frame%06d.png -filter_complex "[0:v][1:v] overlay=0:0" -c:v libx264 -crf 25 -pix_fmt yuv420p VideoOutput/${outputFilename}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing FFmpeg command:', error);
                reject(error);
                return;
            }
            console.log('FFmpeg command output:', stdout);
            console.error('FFmpeg command errors:', stderr);
            resolve(`http://localhost:3001/videos/${outputFilename}`);
        });
    });
}

