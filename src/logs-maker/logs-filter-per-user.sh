#!/bin/bash
# logs-filter-per-user.sh
#
# Purpose: Filters the combined log file to show only contributions from a specific user
# How it works:
# 1. Prompts the user to enter a contributor's name
# 2. Filters the ACombinedLog.txt file to include only entries from that contributor
# 3. Saves the filtered log as a new file named after the contributor
# This is useful for analyzing individual contributions within a multi-repository project

# Navigate to the logs directory
cd ..
cd ..
cd logs

# Prompt for the contributor's name to filter by
echo -n "Enter contributor name: "
read username

# Create a filtered log file containing only entries from the specified contributor
# The grep command searches for the username in the third field, which contains the contributor name
grep "|$username|" ACombinedLog.txt > $username.txt

echo "Done! Created $username.txt"

#sed -i "/username/d" ACombinedLog.txt

#To delete all lines EXCEPT those matching the provided pattern you need to use the ! modifier:
sed -i "/$username/!d" ACombinedLog.txt

#tail ACombinedLog.txt