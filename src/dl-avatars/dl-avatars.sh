#!/bin/bash
# dl-avatars.sh
#
# Purpose: Coordinates the downloading of avatars for all contributors across repositories
# How it works:
# 1. Creates an 'avatars' directory if it doesn't exist
# 2. For each repository in the repos directory:
#    a. Changes to the repository directory
#    b. Calls the Perl script dl-avatars.pl to download avatars for contributors
# This enhances the Gource visualization by showing contributor profile images

echo "
┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐
│ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐
└─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘
/ Avatar Downloader /
"

# Create the avatars directory if it doesn't exist
mkdir -p ../../avatars
cd ../../repos

# Loop through each repository in the repos directory
# Excluding the parent directory (.)
for i in $(find . -maxdepth 1 -type d -not -path "."); do
    cd $i
    # Call the Perl script to download avatars for contributors in this repository
    # The Perl script will handle the extraction of email addresses and downloading
    # of avatars from Gravatar
    perl ../../src/dl-avatars/dl-avatars.pl
    cd ..
done

echo "Done"
