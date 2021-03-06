# creating a menu with the following options
clear
echo ""
echo ""
echo "     ┌─┐┌─┐┬ ┬┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌─┐┬  ┌─┐		";
echo "     │ ┬│ ││ │├┬┘│  ├┤    │ │ ││ ││  └─┐		";
echo "     └─┘└─┘└─┘┴└─└─┘└─┘   ┴ └─┘└─┘┴─┘└─┘		";
echo "";
echo "";
echo "     ┌─────────────┐          ";
echo "     │ RENDER MENU │   ";
echo "   ┌─┴─────────────┴──────────────────────────────────┐";
echo "   │    1) Open RENDER CONFIGURATOR                   │"
echo "   ├──────────────────────────────────────────────────┤";
echo "   │    2) Render 1minute video of the last 24hrs     │";
echo "   │    3) Render 1minute video of the last week      │";
echo "   │    4) Render 1minute video of the last year      │";
echo "   ├──────────────────────────────────────────────────┤";
echo "   │    5) Back to  main menu                         │";
echo "   └──────────────────────────────────────────────────┘";
echo -n "     └─> Enter your choice [1-5]:";

# Running a forever loop using while statement
# This loop will run untill select the exit option.
# User will be asked to select option again and again
while :
do

# reading choice
read choice

# case statement is used to compare one value with the multiple cases.
case $choice in
  # Pattern 1
  1)  echo "Render-configurator"
      source Render-configurator.sh ;;
  # Pattern 2
  2)  echo "Render Combined today"
      source Render-combined-today.sh ;;
  # Pattern 3
  3)  echo "Render Combined last week"
      source Render-combined-last-week.sh ;;
  # Pattern 4
  4)  echo "Render Combined last year"
      source Render-combined-last-year.sh ;;
  # Pattern 4
  5)  echo "Back to main menu"
      source Gource-tools-Main.sh ;;
  # Default Pattern
  *) echo "     Invalid number..."
    echo "     └─> Enter your choice [1-5]:";;
esac
  echo
done
