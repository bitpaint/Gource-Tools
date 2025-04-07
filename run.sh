#!/bin/bash

echo "
┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┬ ┬┌─┐┌┐ 
│ ┬│ ││ │├┬┘│  ├┤───│││├┤ ├┴┐
└─┘└─┘└─┘┴└─└─┘└─┘  └┴┘└─┘└─┘
/ Starting /
"

# Check if necessary directories exist
if [ ! -d "gource-web/backend" ] || [ ! -d "gource-web/frontend" ]; then
    echo "Error: Incomplete project structure. Please run ./install.sh first"
    exit 1
fi

# Function to stop all processes when the script is interrupted
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handler for CTRL+C
trap cleanup SIGINT

# Start the backend
echo "Starting backend (Flask)..."
cd gource-web/backend
python3 app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Start the frontend
echo "Starting frontend (React)..."
cd gource-web/frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo "
Gource-Tools is running!

Backend (Flask): http://localhost:5000
Frontend (React): http://localhost:3000

Logs:
- Backend: gource-web/backend.log
- Frontend: gource-web/frontend.log

Press CTRL+C to stop all servers
"

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID 