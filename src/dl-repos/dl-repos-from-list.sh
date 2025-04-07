#!/bin/bash
# dl-repos-from-list.sh
# 
# Purpose: Downloads Git repositories listed in the config/repos-list.txt file
# How it works:
# 1. Creates a 'repos' directory if it doesn't exist
# 2. Reads the repositories list from config/repos-list.txt
# 3. Clones each repository to the 'repos' directory


# Create the repos directory if it doesn't exist
mkdir -p ../../repos

# Read each line from the repos-list.txt file
# Skip empty lines (grep . only returns lines with content)
# For each line (repository URL), clone the repository
grep . ../../config/repos-list.txt | while read line ; do
    cd .. ;
    cd .. ;
    cd repos ; 
    git clone $line ;
    echo "  Cloning $line";
    cd .. ;
    cd src ;
    cd dl-repos
  done


echo Done downloading all repos.
