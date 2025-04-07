#!/bin/bash
# render-configurator.sh
#
# Purpose: Configures and renders a video file from Gource visualization
# How it works:
# 1. Provides a menu to select which log file to visualize
# 2. Collects configuration parameters from the user:
#    - Start date
#    - End date
#    - Time compression (seconds per day)
# 3. Runs Gource and pipes the output to FFmpeg to create a video file
# This script generates a high-quality video file that can be shared and viewed without Gource

clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";

# Navigate to the logs directory and prepare file selection menu
cd ../../logs/
set -- *.txt

# Display a menu of available log files and prompt the user to select one
while true; do
    i=0
    for pathname do
        i=$(( i + 1 ))
        printf '%d) %s\n' "$i" "$pathname" >&2
    done

    printf ' └─> Select file to render: ' >&2
    read -r reply

    number=$(printf '%s\n' "$reply" | tr -dc '[:digit:]')

    # Check for valid selection
    if [ "$number" = "0" ]; then
        echo ' !' >&2
        exit
    elif [ "$number" -gt "$#" ]; then
        echo ' Invalid number ' >&2
    else
        break
    fi
done

# Get the selected file name
shift "$(( number - 1 ))"
file=$1

# Clear the screen and show the header again
clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "Selected file: $1";
echo "          ";
echo "          ";

# Collect configuration parameters from the user

# Get the start date in YYYY-MM-DD format
echo Start at YYYY-MM-DD ?
read STARTDATE
echo "          ";
echo "  Gotcha, we start the recording from $STARTDATE - hope you're well."

# Get the end date in YYYY-MM-DD format
echo  End at YYYY-MM-DD ?
read STOPDATE
echo "  Let's do this."

# Get the time compression factor (seconds per day)
# Higher values = slower playback, lower values = faster playback
echo "          ";
echo  Seconds per day?
read SPD
echo "          ";
echo "Oki Doki."

echo "          ";
echo "          ";
echo "┬─┐┌─┐┌┐┌┌┬┐┌─┐┬─┐┬┌┐┌┌─┐";
echo "├┬┘├┤ │││ ││├┤ ├┬┘│││││ ┬";
echo "┴└─└─┘┘└┘─┴┘└─┘┴└─┴┘└┘└─┘";
echo "          ";
echo "          ";

# Navigate to the rendering directory and create renders directory if needed
cd ../src/rendering/
mkdir -p ../../renders
cd ../../logs/

# Run Gource and pipe the output to FFmpeg to create a video file
# Gource options:
# --1920x1080: Sets resolution to Full HD
# --stop-at-end: Closes Gource when the end of the log is reached
# --loop-delay-seconds 10: Waits 10 seconds before looping again
# --user-image-dir: Path to the avatars directory
# --seconds-per-day: Time compression factor
# -r 30: 30 frames per second
# --file-idle-time 0: Files remain visible indefinitely
# -padding 1.3: Adds space around the visualization
# --bloom-intensity 0.25: Adds a subtle glow effect
# --hide: Hides specific UI elements
# Font size and directory name settings for better readability
#
# FFmpeg options:
# -y: Overwrite output file if it exists
# -r 30: Set frame rate to 30fps
# -probesize 42M: Set probe size for input analysis
# -f image2pipe: Specify input format as an image pipe
# -vcodec ppm: Input codec is PPM format (from Gource)
# -i -: Read input from pipe
# -vcodec libx264: Use H.264 codec for output
# -preset veryfast: Use the 'veryfast' encoding preset for faster rendering
# -pix_fmt yuv420p: Use YUV 4:2:0 pixel format (most compatible)
# -crf 1: Set Constant Rate Factor to 1 (high quality)
# -threads 0: Use all available CPU threads
# -bf 0: Disable B-frames
gource \
    $1 \
    --1920x1080 \
    --stop-at-end \
    --loop-delay-seconds 10 \
    --user-image-dir ../avatars/raw/ \
    --start-date "$STARTDATE" \
    --stop-date "$STOPDATE" \
    --seconds-per-day "$SPD" \
    -r 30 \
    --file-idle-time 0 \
    -padding 1.3 \
    --bloom-intensity 0.25 \
    --hide "progress,mouse,filenames,root" \
    --user-font-size 15 \
    --dir-name-position 1 --dir-font-size 20 --dir-name-depth 2 \
    -o - | ffmpeg -y -r 30 -probesize 42M -f  image2pipe -vcodec ppm -i - -vcodec libx264 -preset veryfast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 ../renders/gource.mp4

echo "Done"
cd ../src/rendering/

