grep . ../_List.txt | while read line ; do
    cd repos;
    git clone --quiet "$line";
    echo "  Cloning $line"
    cd ..;
  done
