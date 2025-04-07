#!/bin/bash
# render-4k.sh
#
# Purpose: Renders a high-resolution 4K video file from Gource visualization
# How it works:
# 1. Creates a renders directory if it doesn't exist
# 2. Runs Gource with 4K resolution (3840x2160) settings
# 3. Pipes the output to FFmpeg to create a high-quality 4K video file
# This script is useful for creating presentation-quality videos with maximum detail

# Navigate to the logs directory
cd ..
cd ..
cd ..
cd logs

# Create the renders directory if it doesn't exist
mkdir -p ../renders

# Display information about the rendering process
echo ""
echo "Rendering 4K video from ACombinedLog.txt"
echo "This may take a long time depending on your hardware"
echo ""

# Run Gource and pipe the output to FFmpeg to create a 4K video file
# Gource options:
# --3840x2160: Sets resolution to 4K UHD
# --stop-at-end: Closes Gource when the end of the log is reached
# --seconds-per-day 0.1: Very fast time compression for overview
# -r 60: 60 frames per second for smooth motion
# --auto-skip-seconds 1: Skip ahead when nothing happens
# --file-idle-time 0: Files remain visible indefinitely
# --padding 1.3: Adds space around the visualization
# --bloom-intensity 0.5: Stronger glow effect for 4K
# --hide: Hides specific UI elements
# Font size and directory name settings for better readability at 4K
#
# FFmpeg options are similar to render-configurator.sh but optimized for 4K
gource \
    ACombinedLog.txt \
    --3840x2160 \
    --stop-at-end \
    --seconds-per-day 0.1 \
    -r 60 \
    --user-image-dir ../avatars/raw/ \
    --auto-skip-seconds 1 \
    --file-idle-time 0 \
    --key \
    --bloom-intensity 0.5 \
    --hide "progress,mouse,filenames" \
    -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset slow -pix_fmt yuv420p -crf 18 -threads 0 -bf 0 ../renders/gource-4k.mp4
