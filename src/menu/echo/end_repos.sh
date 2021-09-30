

clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo " ┌──────────────────────────────────────────────┐";
echo " │  All repos downloaded succesfully !          │";
echo " │  All logs are located at \src\logs           │";
echo " │  Combined file is called _combined.txt       │";
echo " └──────────────────────────────────────────────┘";


read -n 1 -r -s -p "       └─> Press any key for Main Menu."

# this will fire after the key is pressed
cd ..
cd ..
cd menu
source Gource-tools-Main.sh ;
