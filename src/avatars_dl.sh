clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "     ┌──────────────────┐";
echo "     │  AVATAR UPDATER  │";
echo "     └──────────────────┘"
echo "";

## Check if directory is empty
path=$(ls -A 'repos')
if [[ ! -z "$path" ]]; then
    echo "		Directory is not empty, let's continue."
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
rm *.txt
# This is to clean any txt files laying around for differents reasons. don't delete it even if it print an error -I know it's silly but trust me. We should never have .txt files here.


List=( * )
Loop(){
	for item in ${*} ;
	do
	cd ${item}
	cp ../../avatars_dl_grab.pl ${item}.pl
	echo "	    "
	echo "-> Let's search for avatars inside ${item}"
	echo "	    "
	cd ..
	cd ${item}
	perl ${item}.pl
	rm ${item}.pl
	cd ..
	done
	}
Loop ${List[*]}

cd ..
cd avatars
cd converter
source converter.sh
cd .. ##LEAVE THIS
cd .. ##LEAVE THIS
