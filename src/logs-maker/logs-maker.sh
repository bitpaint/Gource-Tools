#!/bin/bash
# logs-maker.sh
#
# Purpose: Generates Gource log files for each repository in the repos directory
# How it works:
# 1. Creates a 'logs' directory if it doesn't exist
# 2. For each repository in the repos directory:
#    a. Uses Gource to generate a custom log file
#    b. Modifies the log file to include the repository name in the file paths
#    c. Moves the log file to the logs directory
# This script is essential for preparing data for Gource visualization

# Create the logs directory if it doesn't exist
mkdir -p ../../logs
cd ..
cd ..
cd repos

# Loop through each directory (repository) in the current directory
# Excluding the parent directory (.)
for i in $(find . -maxdepth 1 -type d -not -path "."); do
    cd $i
    # Generate a custom log file for the repository using Gource
    gource --output-custom-log $i.txt
    # Modify each line in the log file to include the repository name in the path
    # This helps differentiate files from different repositories in the combined visualization
	sed -i -E "s#(.+)\|#\1|/${i}#" $i.txt
    # Move the generated log file to the logs directory
    mv $i.txt ../../logs
    echo "Making log for $i"
    cd ..
done

echo Done.