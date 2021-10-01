cd ..
mkdir renders	&> /dev/null
cd src			&> /dev/null
mkdir repos		&> /dev/null
mkdir logs		&> /dev/null
cd avatars		&> /dev/null
mkdir converted	&> /dev/null
mkdir raw		&> /dev/null
cd ..			&> /dev/null
clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo "	 ┌────────────────────────────────┐";
echo "	 │  Downloading repos.		  │";
echo "	 │  This can take a while.	  │";
echo "	 └────────────────────────────────┘";
echo "   	   └─> Please be patient :)"
echo "		";	source repos_dl.sh			&> /dev/null


clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo "	 ┌────────────────────────────────┐";
echo "	 │  Creating log files.		  │";
echo "	 │  This can take a while.	  │";
echo "	 └────────────────────────────────┘";
echo "    	  └─> We're almost done..."
echo "		";		source repos_update.sh			&> /dev/null


clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo "	 ┌────────────────────────────────┐";
echo "	 │  Downloading avatars.	  │";
echo "	 │  After this we're done. 	  │";
echo "	 └────────────────────────────────┘";
echo "     	  └─> Last step, for real!"
echo "		";		source avatars_dl.sh			&> /dev/null


clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo "	 ┌──────────────────────────────────────────────────────┐";
echo "	 │  Project succesfully initialized !         		│";
echo "	 │  You should be able to RENDER and EXPLORE, now	│";
echo "	 └──────────────────────────────────────────────────────┘";
read -n 1 -r -s -p "   	      └─> Press any key for Main Menu."

# this will fire after the key is pressed
cd ..
cd src
cd menu
source Gource-tools-Main.sh ;
