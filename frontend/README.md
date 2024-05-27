
# Animated Subtitle
## Project Structure

This project consists of two main folders: Backend and Frontend.

## Frontend Setup

To run the frontend part of the application, follow these steps:

1. Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2. Start the development server:
    ```bash
    npm run dev
    ```

## Backend Setup

To run the backend part of the application, follow these steps:

1. Navigate to the `backend/src` directory:
    ```bash
    cd backend/src
    ```

2. Start the backend server:
    ```bash
    node server.js
    ```

### Image Processing and Video Generation

In the backend, processed images with screenshots are saved in the `frames/videoId` directory. These processed images are then overlaid on the original video to create animated subtitles.

The processed video is stored in the `VideoOutput` directory with the corresponding VideoId.

## Themes

The `themes` folder contains predefined themes for the application. These themes can be customized and applied to the video for different visual effects.
