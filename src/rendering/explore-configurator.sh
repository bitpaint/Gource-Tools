#!/bin/bash
# explore-configurator.sh
#
# Purpose: Configures and launches Gource for interactive exploration of repository history
# How it works:
# 1. Provides a menu to select which log file to visualize
# 2. Collects configuration parameters from the user:
#    - Start date
#    - End date
#    - Time compression (seconds per day)
# 3. Launches Gource with the selected parameters
# This script allows for customized, interactive visualization without rendering to video

# Set the root directory path
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"
AVATARS_DIR="$ROOT_DIR/avatars/raw"

# Create necessary directories
mkdir -p "$AVATARS_DIR"

clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";

# Navigate to the logs directory
cd "$LOGS_DIR"

# Set up a file selection menu for log files
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
echo "Seconds per day? (suggested: 8.57 or 1.93)"
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

echo "Launching Gource interactive visualization..."

# Launch Gource with the configured parameters
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
    --dir-name-position 1 --dir-font-size 15 --dir-name-depth 1 