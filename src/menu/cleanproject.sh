echo "Cleaning avatars"
cd ..
cd avatars
cd converted
rm -r -f *.*
cd ..

cd raw
rm -r -f *.*
cd ..
cd .. 


echo "Cleaning logs"
cd logs
rm -r -f *.*
cd ..

echo "Cleaning repos"
rm -r -f repos
mkdir repos



$SHELL