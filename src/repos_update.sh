clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "     ┌─────────────────┐";
echo "     │  REPOS UPDATER  │";
echo "     └─────────────────┘"
echo "";

## Check if directory is empty
path=$(ls -A 'repos')
if [[ ! -z "$path" ]]; then
    echo "		"
else
  	echo "	Repos directory is empty..."
		echo "	Try 1) Initialize from List.txt instead"
		echo "	Back to main menu in 5 seconds"
	sleep 5  # Waits 5 seconds.
	cd menu
	source Gource-tools-Main.sh
fi
## Check if directory is empty END








cd repos
ls | xargs -P10 -I{} git -C {} pull
cd ..
echo Done

# ^ UPDATE REPOS

# Sort all the logs files for gource .

# Create all the txt files for gource .



echo "┌─┐┌─┐┌┐┌┌─┐┬─┐┌─┐┌┬┐┬┌┐┌┌─┐        ";
echo "│ ┬├┤ │││├┤ ├┬┘├─┤ │ │││││ ┬        ";
echo "└─┘└─┘┘└┘└─┘┴└─┴ ┴ ┴ ┴┘└┘└─┘        ";
echo "┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐┌─┐  ┌─┐┬┬  ┌─┐┌─┐";
echo "│ ┬│ ││ │├┬┘│  ├┤ └─┐  ├┤ ││  ├┤ └─┐";
echo "└─┘└─┘└─┘┴└─└─┘└─┘└─┘  └  ┴┴─┘└─┘└─┘";
echo "          ";

echo "Cleaning old logs";
cd logs
echo "...";
rm -f *.txt
echo "";
echo "";
cd ..
cd repos



List=( * )
Loop(){
	for item in ${*} ;
	do
	#should find a way to add grab avatars here and move them to a temporary directory#
	gource --output-custom-log ${item}.txt ${item} # Create a log file
	echo Making		 gource log file for ${item}
	sed -i -r "s#(.+)\|#\1|/${item}#" ${item}.txt # Sort the log file
	echo Sorting	 gource log file for ${item}
	echo " "
	done
	}
Loop ${List[*]}


echo "          ";
echo "          ";
echo "┌─┐┌─┐┬─┐┌┬┐┬┌┐┌┌─┐";
echo "└─┐│ │├┬┘ │ │││││ ┬";
echo "└─┘└─┘┴└─ ┴ ┴┘└┘└─┘";
echo "          ";
echo "          ";




mv *.txt ..
cd ..
echo Moving logs to logs folder
mv *.txt "logs"


echo "Done.   ";

# ^ MAKE LOGS


cd logs
echo Creating _combined.txt
cat *.txt | sort -n > _combined.txt
cd ..
echo Done

# ^ COMBINE LOGS

cd logs
echo Cleaning double-entries, this may take a while...
sed '$!N; /^\(.*\)\n\1$/!P; D' _combined.txt > temp.txt
rm -f _combined.txt
mv temp.txt _combined.txt
echo "Thank's for waiting, human. The job is done"
cd ..
# ^ REMOVE DOUBLE ENTRY
