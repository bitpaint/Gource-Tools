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

# Set the root directory path
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"
RENDERS_DIR="$ROOT_DIR/renders"
AVATARS_DIR="$ROOT_DIR/avatars/raw"

# Create necessary directories
mkdir -p "$RENDERS_DIR"
mkdir -p "$AVATARS_DIR"

clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";

# Navigate to the logs directory and prepare file selection menu
cd "$LOGS_DIR"
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
file="$1"
selected_log="$LOGS_DIR/$file"

# Clear the screen and show the header again
clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "Selected file: $file";
echo "          ";
echo "          ";

# Collect configuration parameters from the user

# Get the start date in YYYY-MM-DD format
echo "Start at YYYY-MM-DD ?"
read -r STARTDATE
echo "          ";
echo "  Gotcha, we start the recording from $STARTDATE - hope you're well."

# Get the end date in YYYY-MM-DD format
echo "End at YYYY-MM-DD ?"
read -r STOPDATE
echo "  Let's do this."

# Get the time compression factor (seconds per day)
# Higher values = slower playback, lower values = faster playback
echo "          ";
echo "Seconds per day?"
read -r SPD
echo "          ";
echo "Oki Doki."

echo "          ";
echo "          ";
echo "┬─┐┌─┐┌┐┌┌┬┐┌─┐┬─┐┬┌┐┌┌─┐";
echo "├┬┘├┤ │││ ││├┤ ├┬┘│││││ ┬";
echo "┴└─└─┘┘└┘─┴┘└─┘┴└─┴┘└┘└─┘";
echo "          ";
echo "          ";

# Generate output filename based on input file
OUTPUT_FILE="$RENDERS_DIR/gource_${file%.*}_$(date +%Y%m%d%H%M%S).mp4"

echo "Rendering to: $OUTPUT_FILE"
echo "This may take a while depending on the size of your log file..."

# Run Gource and pipe the output to FFmpeg to create a video file
gource \
    "$selected_log" \
    --1920x1080 \
    --stop-at-end \
    --loop-delay-seconds 10 \
    --user-image-dir "$AVATARS_DIR" \
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
    -o - | ffmpeg -y -r 30 -probesize 42M -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset veryfast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 "$OUTPUT_FILE"

echo ""
echo "Rendering complete! Your video is available at:"
echo "$OUTPUT_FILE"

