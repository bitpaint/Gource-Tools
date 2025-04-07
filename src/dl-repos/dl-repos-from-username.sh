#!/bin/bash
# dl-repos-from-username.sh
#
# Purpose: Downloads all public repositories from a GitHub username
# How it works:
# 1. Prompts the user for a GitHub username
# 2. Uses curl and the GitHub API to retrieve repository data
# 3. Clones each repository to the 'repos' directory

# Create the repos directory if it doesn't exist
mkdir -p ../../repos

# Prompt the user to enter a GitHub username
echo -n "Enter GitHub username: "
read username

# Use the GitHub API to get a list of all public repositories for the username
# Then pipe to jq to extract the clone URLs, then clone each repository
curl -s https://api.github.com/users/$username/repos | grep clone_url | cut -d \" -f4 | xargs -n1 git clone

echo "  Done downloading all repos."