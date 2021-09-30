# creating a menu with the following options
clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                                    v0.1";
echo "";
echo "     ┌─────────────┐";
echo "     │  MAIN MENU  │";
echo "   ┌─┴─────────────┴──────────────────────────┐";
echo "   │    1) Initialize from List.txt           │";
echo "   ├──────────────────────────────────────────┤";
echo "   │    2) Go to RENDER MENU                  │";
echo "   │    3) Go to EXPLORE MENU                 │";
echo "   ├──────────────────────────────────────────┤";
echo "   │    4) Update repos                       │";
echo "   │    5) Update avatars                     │";
echo "   ├──────────────────────────────────────────┤";
echo "   │    6) Reset Gource Tools	              │";
echo "   │    7) Exit                               │";
echo "   └──────────────────────────────────────────┘";
echo -n "    └─> Enter your choice [1-7]:";

# Running a forever loop using while statement
# This loop will run untill select the exit option.
# User will be asked to select option again and again
while :
do

# reading choice
read choice

# case statement is used to compare one value with the multiple cases.
case $choice in
  # Pattern 1
  1)  echo "Initialize from List.txt"
      cd ..
      source _init.sh ;;
  # Pattern 2
  2)  echo "Create a video"
      source Gource-tools-Render.sh ;;
  # Pattern 3
  3)  echo "Explore freely"
      cd ..
      source repos_update.sh;;
  # Pattern 4
  4)  echo "Update repos"
      cd ..
      source repos_update.sh
      cd menu
      cd echo
      source end_repos.sh;;
  # Pattern 5
  5)  echo "Update avatars"
      cd ..
      source avatars_dl.sh
      cd menu
      cd echo
      source end_avatar.sh;;
  # Pattern 6
  6)  echo "Clean previously downloaded data"
      cd ..
      cd src
      source cleanup.sh;;
  # Pattern 7
  7)  echo "Exit"
      exit;;

  # Default Pattern
  *) echo "     Invalid number..."
    echo "     └─> Enter your choice [1-7]:";;
esac
  echo
done
