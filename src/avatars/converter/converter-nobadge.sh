cd ..
cd raw

List=( ./*.png )
Loop(){
	for item in ${*} ;
	do
		convert ${item} -alpha set \
		-background none  -vignette 0x1.5  ../converted/${item}
	echo Making avatar file for ${item}
	done
	}
Loop ${List[*]}

echo ok

$SHELL