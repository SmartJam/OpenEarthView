RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
classname="$(basename ${0/.sh/})"

wget --quiet "http://www.openearthview.net/3dtile.php?format=osm&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_osm.xml
sed -i 's/<osm version="0.6".*>/<osm version="0.6">/g' 18_134118_95589_osm.xml
testResult="$(diff -E -b -q ./18_134118_95589_osm.xml ../resources/18_134118_95589_osm.xml)"
diffResult=$?
if [ $diffResult -eq 0 ]; then
  echo "${var//$/ }"
   printf "${GREEN}✔ $classname - osm test ok.${NC}\n"
else
  >&2 printf "${RED}✖ $classname - osm test: $testResult${NC}\n";
fi

# http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589
wget --quiet "http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_geojson.json
testResult="$(diff -E -b -q ./18_134118_95589_geojson.json ../resources/18_134118_95589_geojson.json)"
diffResult=$?
if [ $diffResult -eq 0 ]; then
  echo "${var//$/ }"
  printf "${GREEN}✔ $classname - geojson test ok.${NC}\n"
else
  >&2 printf "${RED}✖ $classname - geojson test: $testResult${NC}\n";
fi
