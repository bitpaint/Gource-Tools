## Create CURRENTDATE & LASTWEEK variable ##
CURRENTDATE=`date +"%Y-%m-%d"`
YESTERDAY=`date -d '-1day' +"%Y-%m-%d"`
echo Current Date: ${CURRENTDATE}
echo Yesterday Week: ${YESTERDAY}




cd ..
cd logs


echo "          ";
echo "┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐";
echo "│ ┬│ ││ │├┬┘│  ├┤ ";
echo "└─┘└─┘└─┘┴└─└─┘└─┘";
echo "Welcome to Bitcoin Gource";
echo "          ";
echo "          ";


gource \
    _combined.txt \
    --1920x1080 \
    --stop-at-end \
    --loop-delay-seconds 10 \
    --user-image-dir ../avatars/converted \
    --start-date "$YESTERDAY" \
    -r 30 \
    --seconds-per-day "40" \
    -padding 1.5 \
    --bloom-intensity 0.25 \
    --hide "progress,mouse,filenames,root" \
    --user-font-size 15 \
    --dir-name-position 1 --dir-font-size 30 --dir-name-depth 1 \
    -o - | ffmpeg -y -r 30 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset veryfast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 ../../renders/gource.mp4 


sleep 3
echo "Rendering done  ";
echo "          ";
echo "┌─┐┬ ┬┌┬┐  ┌┬┐┬ ┬┌─┐ ";
echo "├─┘│ │ │    │ ├─┤├┤  ";
echo "┴  └─┘ ┴    ┴ ┴ ┴└─┘ ";
echo "┌┬┐┬ ┬┌─┐┬┌─┐  ┌─┐┌┐┌";
echo "││││ │└─┐││    │ ││││";
echo "┴ ┴└─┘└─┘┴└─┘  └─┘┘└┘";
echo "          ";
echo "          ";
echo "          ";

cd ..
cd ..
cd renders

ffmpeg -i gource.mp4 -i ../_audio.mp3 -map 0 -map 1:a -c:v copy -shortest gourcesound.mp4

ffmpeg -i gourcesound.mp4 -filter_complex \
  "fade=in:st=0:d=5, fade=out:st=55:d=5; \
   afade=in:st=0:d=10 , afade=out:st=50:d=10" \
 -c:v libx264 -c:a aac gourcesoundfade.mp4


echo "          ";
echo "┌─┐┌─┐┌─┐┬  ┬ ┬                 ";
echo "├─┤├─┘├─┘│  └┬┘                 ";
echo "┴ ┴┴  ┴  ┴─┘ ┴                  ";
echo "┌─┐┌─┐┌┬┐┌─┐  ┌─┐┌─┐┌─┐┌─┐┌─┐┌┬┐";
echo "├┤ ├─┤ ││├┤   ├┤ ├┤ ├┤ ├┤ │   │ ";
echo "└  ┴ ┴─┴┘└─┘  └─┘└  └  └─┘└─┘ ┴ ";
echo "          ";
echo "          ";-
echo "          ";

ffmpeg -i gourcesoundfade.mp4 -af "afade=t=out:st=10:d=50"  _combined-Today-$CURRENTDATE.mp4



rm gourcesoundfade.mp4
rm gourcesound.mp4
rm gource.mp4
start .
echo "┌┬┐┌─┐┌┐┌┌─┐              ";
echo " │││ ││││├┤               ";
echo "─┴┘└─┘┘└┘└─┘             ";
echo "          ";
echo "          ";
echo "          ";




clear
echo "                ";
echo "                ";
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "                ";
echo " ┌──────────────────────────────────────────────────────┐";
echo " │  Render done!         	                        │";
echo " │  File located inside /renders folder 	        │";
echo " └──────────────────────────────────────────────────────┘";
read -n 1 -r -s -p "       └─> Press any key for Main Menu."

# this will fire after the key is pressed
cd ..
cd src
cd menu
source Gource-tools-Main.sh ;
