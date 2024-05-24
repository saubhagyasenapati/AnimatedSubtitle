import express from 'express';
import cors from 'cors';
import { uploadVideo, uploadHandler, processVideo } from './routes.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.post('/upload', uploadVideo, uploadHandler);
app.post('/apply-caption', processVideo);

// Serve static files
app.use('/videos', express.static('VideoOutput'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
