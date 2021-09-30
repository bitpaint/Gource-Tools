
cd ..
cd raw
for f in *\ *; do mv "$f" "${f// /_}"; done

for f in *.png; do
  convert ./"$f" ./"${f%.png}.gif"
  echo Converting $f
done

rm *png

List=( ./*.gif )
Loop2(){
	for item in ${*} ;
	do
	convert ${item} -alpha set -gravity center -extent 90x90 \
          ../converter/badge_mask.png -compose DstIn -composite \
          ../converter/badge_shading.png -compose Over -composite \
          ../converted/${item}.png
	echo Making avatar file for ${item}
	done
	}
Loop2 ${List[*]}


cd ..
cd converted
for f in *.gif.png; do
    mv -- "$f" "${f%.gif.png}.png"
done
#rename gif.png to png ^



set -- *_*
for file; do
    mv -- "$file" "${file//_/ }"
done
#delete underscore ^
