cd ..
cd logs
echo Cleaning double-entries, this may take a while...
sed '$!N; /^\(.*\)\n\1$/!P; D' _combined.txt > temp.txt
rm -f _combined.txt
mv temp.txt _combined.txt
echo Thank's for waiting, human. The job is done