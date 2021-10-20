# Add Custom hex color to Specific project
# usage: CHANGE HEX CODE AND .TXT FILES AS NEEDED. YOU NEEED TO GENERATE LOGS BEFORE. THIS WILL OVERRIDE FILES
sed -i '/:[0-9]*$/ ! s/$/|FFA500/' bitcoin.txt
sed -i '/:[0-9]*$/ ! s/$/|FFA500/' bips.txt
sed -i '/:[0-9]*$/ ! s/$/|00FF00/' bisq.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' btcpayserver.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' btcpayserver-media.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' btcpayserver-docker.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' btcpayserver-doc.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' btcpayserver-design.txt
sed -i '/:[0-9]*$/ ! s/$/|59ba47/' woocommerce-greenfield-plugin.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-os.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-website.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-apps-gallery.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-manager.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-dashboard.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-middleware.txt
sed -i '/:[0-9]*$/ ! s/$/|5351FB/' umbrel-dev.txt
sed -i '/:[0-9]*$/ ! s/$/|93d1ff/' mempool.txt
sed -i '/:[0-9]*$/ ! s/$/|93d1ff/' mempool-cli.txt 
sed -i '/:[0-9]*$/ ! s/$/|FFC83D/' raspiblitz.txt

# Combine logs
cat *.txt | sort -n > _combined.txt

# Remove double entries
sed -i '$!N; /^\(.*\)\n\1$/!P; D' _combined.txt
