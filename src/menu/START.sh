#!/bin/bash
# START.sh
# Main menu script for Gource-Tools
# This script serves as the central controller for the entire application
# It provides a text-based interface for accessing all the functionalities


# Display ASCII art header for Gource-Tools
echo "        ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐ ┌┬┐┌─┐┌─┐┬  ┌─┐";
echo "        │ ┬│ ││ │├┬┘│  ├┤───│ │ ││ ││  └─┐";
echo "        └─┘└─┘└─┘┴└─└─┘└─┘  ┴ └─┘└─┘┴─┘└─┘";
echo "     ┌─────────────┐";
echo "     │  MAIN MENU  │";
echo "   ┌─┴─────────────┴──────────────────────────┐";
echo "   │    1) Download repos from list           │"; # Import repos from config/repos-list.txt
echo "   │    2) Download repos from username       │"; # Import all repos from a GitHub username
echo "   │    3) Download avatars                   │"; # Get user avatars from Gravatar
echo "   │    4) Download ... list + avatars        │"; # Combination of options 1 and 3
echo "   │    5) Download ... username + avatars    │"; # Combination of options 2 and 3
echo "   ├──────────────────────────────────────────┤";
echo "   │    6) Make Gource log for each repo      │"; # Generate log files needed for visualization
echo "   │    7) Color patcher                      │"; # Customize visualization colors
echo "   │    8) Combine all logs into combined.txt │"; # Merge individual logs into one file
echo "   ├──────────────────────────────────────────┤";
echo "   │    9) Update all repos and make new logs │"; # Refresh repos and regenerate logs
echo "   ├──────────────────────────────────────────┤";
echo "   │    10) Gource alone                      │"; # Interactive visualization mode
echo "   │    11) Gource + render (using ffmpeg)    │"; # Create video files of the visualization
echo "   ├──────────────────────────────────────────┤";
echo "   │    12) Reset gource-tools 	              │"; # Clean up generated files
echo "   │    13) Exit                              │"; # Exit the application
echo "   └──────────────────────────────────────────┘";
echo -n "    └─> Enter your choice [1-13]:";

# Running a forever loop using while statement
# This loop will run until the user selects the exit option
# User will be prompted to select an option repeatedly until they exit
while :
do

# Reading user's choice
read choice

# Case statement to handle different menu options
case $choice in
# Pattern 1 - Download repositories from a list in config/repos-list.txt
  1)  echo "== Download repos from list ==" 
    cd ../dl-repos
   ./dl-repos-from-list.sh
  source ../menu/START.sh ;;
# Pattern 2 - Download all repositories from a GitHub username
  2)  echo "== Download repos from username =="
    cd ../dl-repos
   ./dl-repos-from-username.sh
  source ../menu/START.sh ;;
# Pattern 3 - Download avatars for all contributors in the repositories
  3)  echo "== Download avatars =="
  cd ../dl-avatars
  ./dl-avatars.sh
  source ../menu/START.sh ;;
# Pattern 4 - Combined operation: download repos from list and their avatars
    4)  echo "== Download ... list + avatars =="
      cd ../dl-repos
     ./dl-repos-from-list.sh
     cd ../dl-avatars
     ./dl-avatars.sh
     source ../menu/START.sh ;;
  
# Pattern 5 - Combined operation: download repos from username and their avatars
  5)  echo "== Download ... username + avatars =="
      cd ../dl-repos
     ./dl-repos-from-username.sh
     cd ../dl-avatars
     ./dl-avatars.sh
     source ../menu/START.sh ;;
# Pattern 6 - Generate Gource log files for each repository
  6)  echo "== Make goutce logs for each repo =="
  cd ../logs-maker
   ./logs-maker.sh 
  source ../menu/START.sh ;;
# Pattern 7 - Modify colors in the log files
  7)  echo "== Color patcher =="
  cd ../logs-colorizer
   ./color-random.sh 
  source ../menu/START.sh ;;
# Pattern 8 - Combine all individual logs into one master log file
  8)  echo "== Combine all logs into combined.txt =="
  cd ../logs-maker
   ./logs-combiner.sh 
  source ../menu/START.sh ;;
# Pattern 9 - Update all repositories and regenerate log files
  9)  echo "== Update all repos and make new logs =="
  cd ../update-repos
   ./update-repos.sh 
   cd ../logs-maker
   ./logs-maker.sh 
     cd ../logs-maker
   ./logs-combiner.sh 
  source ../menu/START.sh ;;
# Pattern 10 - Launch Gource in interactive exploration mode
  10)  echo "== Gource alone =="
  cd ../rendering
   ./explore-configurator.sh 
  source ../menu/START.sh ;;
# Pattern 11 - Configure and render a video file of the visualization
  11)  echo "== Gource and render =="
  cd ../rendering
   ./render-configurator.sh 
  source ../menu/START.sh ;;
# Pattern 12 - Reset the application by cleaning generated files
  12)  echo "== Reset gource-tools =="
  cd ../reset
   ./reset.sh 
  source ../menu/START.sh ;;
# Pattern 13 - Exit the application
  13)  echo "Exit"
      exit;;

# Default Pattern - Handle invalid inputs
  *) echo "     Invalid number..."
    echo "     └─> Enter your choice [1-13]:";;
esac
  echo
done
