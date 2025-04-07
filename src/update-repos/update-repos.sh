#!/bin/bash
# update-repos.sh
#
# Purpose: Updates all cloned Git repositories with latest changes
# How it works:
# 1. Changes to the repos directory
# 2. For each repository:
#    a. Changes to the repository directory
#    b. Performs a git pull to fetch and merge the latest changes
# This script ensures that visualizations include the most recent activity

# Navigate to the repos directory
cd ../../repos

# Loop through each repository in the repos directory
# Find all directories (excluding the parent directory)
# Enter each directory and perform a git pull
find . -maxdepth 1 -mindepth 1 -type d -exec sh -c "cd '{}' && echo 'Updating {}' && git pull" \;

echo " "
echo All repos up to date.