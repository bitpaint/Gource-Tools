cd ..
mkdir renders

mkdir repos

source repos_dl.sh
echo repos_dl done

source repos_update.sh
echo repos_update done

source avatars_dl.sh
echo avatars_dl done

clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo " ┌──────────────────────────────────────────────────────┐";
echo " │  Project succesfully initialized !         		│";
echo " │  You should be able to RENDER and EXPLORE, now	│";
echo " └──────────────────────────────────────────────────────┘";
read -n 1 -r -s -p "       └─> Press any key for Main Menu."

# this will fire after the key is pressed
cd ..
cd src
cd menu
source Gource-tools-Main.sh ;
