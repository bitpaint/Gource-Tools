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


gource _combined.txt   --file-filter "/*\.png|.jpg|.bmp|.jpeg|.expected|.gif|.svg|.json|.txt|.java|.html" --stop-at-end --loop-delay-seconds 160  --dir-name-position 1 --dir-font-size 30 --dir-name-depth 1 --file-idle-time 0  --max-files 120000 --user-image-dir ../avatars/converted -1920x1080   --start-date "2008-01-01"  -r 30 --seconds-per-day "0.84" --padding 1.5  -a 0.5 --hide "progress,mouse,filenames,root" 	--bloom-intensity 0.25    -o - | ffmpeg -y -r 30 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset veryfast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 ../../renders/gource.mp4

echo "Rendering done  ";
echo "exporting  ";
sleep 5
echo "Export ok  ";
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
start .

echo "DONE"

$SHELL
