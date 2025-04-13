#!/bin/bash

# Simple wrapper script for run-gource.js with default for rendering in 4K

CURRENT_DIR=$(dirname "$0")
PROJECT_ROOT=$(dirname "$CURRENT_DIR")

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed." >&2
    exit 1
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed." >&2
    exit 1
fi

# Check for gource
if ! command -v gource &> /dev/null; then
    echo "Error: gource is required but not installed." >&2
    exit 1
fi

# Set default timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$PROJECT_ROOT/exports/renders/gource-$TIMESTAMP.mp4"

# Process arguments for a simplified interface
LOG_FILE=""
PRESET="4k"
TIME_RANGE=""

show_help() {
    echo "Gource Rendering Script"
    echo "Usage: $0 [options] <log-file>"
    echo ""
    echo "Options:"
    echo "  -p, --preset <preset>   Use a preset (hd, 4k, preview)"
    echo "  -o, --output <file>     Specify output file"
    echo "  -t, --time <range>      Time range (week, month, year)"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Example:"
    echo "  $0 -p hd -t month logs/project.log"
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--preset)
            PRESET="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -t|--time)
            TIME_RANGE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            LOG_FILE="$1"
            shift
            ;;
    esac
done

# Check for log file
if [ -z "$LOG_FILE" ]; then
    echo "Error: No log file specified" >&2
    show_help
fi

# Build the command
CMD="node \"$CURRENT_DIR/run-gource.js\""

# Add options
CMD="$CMD --preset $PRESET"
CMD="$CMD --output \"$OUTPUT_FILE\""

if [ -n "$TIME_RANGE" ]; then
    CMD="$CMD --time-range $TIME_RANGE"
fi

# Add log file
CMD="$CMD \"$LOG_FILE\""

# Echo the command to be executed
echo "Executing: $CMD"

# Execute the command
eval $CMD

exit $? 