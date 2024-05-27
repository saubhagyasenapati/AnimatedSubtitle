import fs from 'fs';
import path from 'path';
import multer from 'multer';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import multiparty from 'multiparty';
import { combineFramesIntoVideo, getVideoMetadata, renderSubtitles } from './methods.js';

// Initialize an object to store video paths
const videoPaths = {};

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

export const uploadHandler = (req, res) => {
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
    const theme = fields.theme && fields.theme[0];
    console.log(fields);
    if (!theme) {
      return res.status(400).send('Theme not provided.');
    }
    // Retrieve the transcription file from the files object
    const transcriptionFile = files.transcription && files.transcription[0]; // Multiparty stores files in an array
    if (!transcriptionFile) {
      return res.status(400).send('Transcription file not provided.');
    }

    try {
      // Read the transcription file content
      const transcriptionContent = fs.readFileSync(transcriptionFile.path, 'utf-8');
      // Parse transcription content as JSON
      const transcription = JSON.parse(transcriptionContent);

      const videoMetadata = await getVideoMetadata(videoFile.path);
      const videoId = uuidv4();
      
      await renderSubtitles(videoMetadata, videoFile.path, transcription, videoId, theme);
      const outputUrl = await combineFramesIntoVideo(videoFile.path, videoId);
      res.status(200).send({ url: outputUrl });
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).send('Internal server error.');
    }
  });
};
