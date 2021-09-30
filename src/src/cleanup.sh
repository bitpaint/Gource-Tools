echo "Cleaning avatars"
cd ..
cd avatars
cd converted
rm -r -f -- *.*
cd ..

cd raw
rm -r -f -- *.*
cd ..
cd ..


echo "Cleaning logs"
cd logs
rm -r -f -- *.*
cd ..

echo "Cleaning repos"
rm -r -f repos
mkdir repos



clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo " ┌───────────────────────────────────────────────────────────┐";
echo " │ Gource tools was succesfully reset !	                     │";
echo " │  (we didn't touch List.txt _audio.mp3 and background.jpg) │";
echo " └───────────────────────────────────────────────────────────┘";


read -n 1 -r -s -p "       └─> Press any key for Main Menu."

# this will fire after the key is pressed

cd menu
source Gource-tools-Main.sh ;
