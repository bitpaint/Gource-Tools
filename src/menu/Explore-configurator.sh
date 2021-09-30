clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";






## Move to gource logs, list all the .txt
cd ..
cd logs
set -- *.txt

while true; do
    i=0
    for pathname do
        i=$(( i + 1 ))
        printf '%d) %s\n' "$i" "$pathname" >&2
    done

    printf ' └─> Select file to explore: ' >&2
    read -r reply

    number=$(printf '%s\n' "$reply" | tr -dc '[:digit:]')

    if [ "$number" = "0" ]; then
        echo ' !' >&2
        exit
    elif [ "$number" -gt "$#" ]; then
        echo ' Invalid number ' >&2
    else
        break
    fi
done

shift "$(( number - 1 ))"
file=$1

# select menu





clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "  Selected file: $1";
echo "          ";
echo "          ";


echo Start at YYYY-MM-DD ?
read STARTDATE
echo "          ";
echo "  Gotcha, we start the recording from $STARTDATE - hope you're well."


echo  End at YYYY-MM-DD ?
read STOPDATE
echo "  Let's do this."

echo "          ";
echo "  Seconds per day? High value to see changes (1-10) low value to deploy full project quickly (0.005)"
read SPD
echo "          ";
echo "  Oki Doki."




gource $1 --user-image-dir ../avatars/converted -1920x1080  --start-date "$STARTDATE"  --file-idle-time 0  --stop-date "$STOPDATE"  --filename-time 2.0   -r 30 --seconds-per-day "$SPD" --padding 1.3 -a 0.5 --hide "filenames,root" -key --title " "  --user-font-size 20
