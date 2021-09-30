

clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo " ┌──────────────────────────────────────────────────────┐";
echo " │  All avatars downloaded succesfully !		│";
echo " │  badges are located at \src\avatars\converted	│";
echo " └──────────────────────────────────────────────────────┘";


read -n 1 -r -s -p "       └─> Press any key for Main Menu."

# this will fire after the key is pressed
cd ..
cd ..
cd menu
source Gource-tools-Main.sh ;
