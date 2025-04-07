#!/bin/bash
# color-random.sh
#
# Purpose: Modifies the log file to assign random colors to different file types
# How it works:
# 1. Prompts the user to select a log file
# 2. Applies sed substitutions to modify the color fields in the log
# 3. The color field is the 6th field in each log entry (separated by |)
# This enhances visualization by differentiating file types with distinct colors

echo "
┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐
│ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐
└─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘
/ Color Patcher - Random /
"

# Navigate to the logs directory
cd ..
cd ..
cd logs

# Prompt the user to select which log file to modify
echo "Which log file to color-patch? : "
read FILETOCOLOR

# Randomly assign colors to different file extensions by modifying the color field
# Each sed command targets files with a specific extension and assigns a random color value
# The format of the color field is |RRGGBB|
sed -i 's/|A\([^|]*\.[hc]|[^|]*\)|/|A\1FF0000|/g' $FILETOCOLOR
sed -i 's/|A\([^|]*\.cpp|[^|]*\)|/|A\1FF7F00|/g' $FILETOCOLOR
sed -i 's/|A\([^|]*\.py|[^|]*\)|/|A\1FFFF00|/g' $FILETOCOLOR
sed -i 's/|A\([^|]*\.pl|[^|]*\)|/|A\100FF00|/g' $FILETOCOLOR
sed -i 's/|A\([^|]*\.sh|[^|]*\)|/|A\10000FF|/g' $FILETOCOLOR

echo "Done!"

/bin/bash