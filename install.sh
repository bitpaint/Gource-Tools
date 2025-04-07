#!/bin/bash

echo "
┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┬ ┬┌─┐┌┐ 
│ ┬│ ││ │├┬┘│  ├┤───│││├┤ ├┴┐
└─┘└─┘└─┘┴└─└─┘└─┘  └┴┘└─┘└─┘
/ Installation /
"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install it before continuing."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Node.js/npm is required but not installed. Please install it before continuing."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "Git is required but not installed. Please install it before continuing."
    exit 1
fi

if ! command -v gource &> /dev/null; then
    echo "Warning: Gource is not installed. It will be needed for visualization."
    echo "Please visit: https://github.com/acaudwell/Gource"
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "Warning: FFmpeg is not installed. It will be needed for video rendering."
    echo "Please visit: https://ffmpeg.org/download.html"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p repos logs avatars renders config

# Install backend dependencies
echo "Installing Python dependencies for backend..."
cd gource-web/backend
pip install -r requirements.txt
cd ../..

# Install frontend dependencies
echo "Installing Node.js dependencies for frontend..."
cd gource-web/frontend
npm install
cd ../..

echo "Installation completed successfully!"
echo "To start the application, run: ./run.sh" 