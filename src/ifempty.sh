

## Check if directory is empty 
path=$(ls -A 'repos')
if [[ ! -z "$path" ]]; then
    echo "Directory is NOT empty!"
else
    echo "Repos directory is empty..."
	echo "Try -initialize from List.txt instead"
	echo "Back to main menu in 10 seconds"
	sleep 10  # Waits 10 seconds.
	cd ..
	source Gource-tools.sh
fi
## Check if directory is empty END


echo test

$SHELL