import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// Video paths storage
const videoPaths = {};

export function getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${videoPath} -hide_banner 2>&1 | grep 'Duration\\|fps\\|Video'`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error getting video metadata: ${stderr}`);
                return;
            }

            const durationMatch = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
            const fpsMatch = stdout.match(/(\d+(\.\d+)?) fps/);
            const resolutionMatch = stdout.match(/, (\d+)x(\d+)/);
             console.log(resolutionMatch);
            if (durationMatch && fpsMatch && resolutionMatch) {
                const hours = parseFloat(durationMatch[1]);
                const minutes = parseFloat(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                const duration = hours * 3600 + minutes * 60 + seconds;
                const frameRate = parseFloat(fpsMatch[1]);
                const width = parseInt(resolutionMatch[1]);
                const height = parseInt(resolutionMatch[2]);
            console.log('FrameRate',frameRate,'Duration',duration,"WidthHeight",width,height);
                resolve({ duration, frameRate, width, height });
            } else {
                reject('Failed to parse video metadata');
            }
        });
    });
}

export async function renderSubtitles(videoMetadata, videoPath, transcription, videoId, themeName, fontSize, primaryColor, highlightColor,yPosition) {
    console.log('Rendering subtitles onto frames...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const framesDirectory = `frames/${videoId}`;
    if (!fs.existsSync(framesDirectory)) {
        fs.mkdirSync(framesDirectory, { recursive: true });
    }

    const themeFilePath = path.join('../themes', `${themeName}.html`);
    if (!fs.existsSync(themeFilePath)) {
        throw new Error(`Theme file ${themeName}.html does not exist`);
    }
    let themeContent = fs.readFileSync(themeFilePath, 'utf-8');

    const { duration, frameRate, width, height } = videoMetadata;
    const totalFrames = duration * frameRate;

    await page.setViewport({ width, height });

    const contentColors = {};
    let colorIndex = 0;
    const colors = ['red', 'yellow'];
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

        const color = contentColors[currentSubtitle ? currentSubtitle.content : ''] || 'white';
        const animationDuration = currentSubtitle ? (parseFloat(currentSubtitle.end_time) - parseFloat(currentSubtitle.start_time)) : 3;
        const subtitleContent = (currentSubtitle && frameNumber >= subtitleStartFrame && frameNumber <= subtitleEndFrame)
            ? currentSubtitle.content
            : '';
            const cssVariables = `
            --font-size: ${fontSize || '70px'};
            --primary-color: ${primaryColor || 'green'};
            --highlight-color: ${highlightColor || 'white'};
            --animation-duration: ${animationDuration}s;
            --y-position: ${yPosition !== undefined ? `calc(50% + ${yPosition}px)` : '50%'};
        `;
        
      

        themeContent = themeContent.replace('/* CSS_VARIABLES */', cssVariables);

        await page.setContent(themeContent.replace('Placeholder', subtitleContent));
 
        const screenshot = await page.screenshot({ type: 'png', omitBackground: true });
        const frameFilePath = path.join(framesDirectory, `frame${frameNumber.toString().padStart(6, '0')}.png`);
        fs.writeFileSync(frameFilePath, screenshot);

        console.log(`Frame ${frameNumber} rendered.`);
    }

    console.log('Rendering subtitles completed.');
    await browser.close();
}

export function combineFramesIntoVideo(videoPath, videoId) {
    return new Promise((resolve, reject) => {
        console.log('Combining frames into video using FFmpeg...');
        const Directory = `VideoOutput`;
        if (!fs.existsSync(Directory)) {
            fs.mkdirSync(Directory, { recursive: true }); 
        }
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
