#!/bin/bash
# logs-combiner.sh
#
# Purpose: Combines all individual repository logs into a single master log file
# How it works:
# 1. Changes to the logs directory
# 2. Concatenates all .txt log files and sorts them chronologically
# 3. Removes any duplicate entries to ensure clean visualization
# This script is crucial for creating a unified timeline across multiple repositories

echo "
┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐
│ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐
└─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘
/ Logs Combiner /
"

# Navigate to the logs directory
cd ..
cd ..
cd logs


# Combine all .txt log files into one file (ACombinedLog.txt)
# The sort -n ensures events are in chronological order
cat *.txt | sort -n > ACombinedLog.txt

# Remove possible duplicate entries to ensure clean visualization
# This sed command compares adjacent lines and removes duplicates
sed -i '$!N; /^\(.*\)\n\1$/!P; D' ACombinedLog.txt

echo "Done"