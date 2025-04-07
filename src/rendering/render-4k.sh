#!/bin/bash
# render-4k.sh
#
# Purpose: Renders a high-resolution 4K video file from Gource visualization
# How it works:
# 1. Creates a renders directory if it doesn't exist
# 2. Runs Gource with 4K resolution (3840x2160) settings
# 3. Pipes the output to FFmpeg to create a high-quality 4K video file
# This script is useful for creating presentation-quality videos with maximum detail

# Set the root directory path
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"
RENDERS_DIR="$ROOT_DIR/renders"
AVATARS_DIR="$ROOT_DIR/avatars/raw"
INPUT_LOG="$LOGS_DIR/combined-repositories.txt"

# Create necessary directories
mkdir -p "$RENDERS_DIR"
mkdir -p "$AVATARS_DIR"

# Check if the combined log file exists
if [ ! -f "$INPUT_LOG" ]; then
    echo "Error: Combined log file not found at $INPUT_LOG"
    echo "Please run logs-combiner.sh first to create the combined log."
    exit 1
fi

# Generate output filename with timestamp
OUTPUT_FILE="$RENDERS_DIR/gource-4k_$(date +%Y%m%d%H%M%S).mp4"

# Display information about the rendering process
echo ""
echo "Rendering 4K video from combined repositories log"
echo "This may take a long time depending on your hardware"
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

# Run Gource and pipe the output to FFmpeg to create a 4K video file
gource \
    "$INPUT_LOG" \
    --3840x2160 \
    --stop-at-end \
    --seconds-per-day 0.1 \
    -r 60 \
    --user-image-dir "$AVATARS_DIR" \
    --auto-skip-seconds 1 \
    --file-idle-time 0 \
    --key \
    --bloom-intensity 0.5 \
    --hide "progress,mouse,filenames" \
    -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset slow -pix_fmt yuv420p -crf 18 -threads 0 -bf 0 "$OUTPUT_FILE"

echo ""
echo "Rendering complete! Your 4K video is available at:"
echo "$OUTPUT_FILE"
