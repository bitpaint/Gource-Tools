#!/bin/bash
# reset.sh
#
# Purpose: Resets the Gource-Tools environment by removing all generated files
# How it works:
# 1. Deletes the repos, logs, avatars, and renders directories
# This is useful when you want to start fresh with new repositories or configurations

# Remove all generated directories and their contents
# The -rf flag forces removal without confirmation and handles directories
rm -rf ../../repos ../../logs ../../avatars ../../renders
