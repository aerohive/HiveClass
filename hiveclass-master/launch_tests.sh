#!/bin/sh

ARCH=$(echo $1 | tr '[:upper:]' '[:lower:]')

if [ "$ARCH" = "" ]; then
    echo "USAGE:"
    echo "$0 <mac32|linux32|linux64> [xnest|xvfb]"
    exit 1
fi

MODE=$(echo "_$2" | tr '[:upper:]' '[:lower:]')

WORKDIR=/tmp/hiveclass_tests_$(date +%s)

mkdir -p ${WORKDIR}
cp ./install_dev.sh ${WORKDIR}
cd ${WORKDIR}

./install_dev.sh &
sleep 60
cd ${WORKDIR}/hiveclass/e2e
mkdir -p bin
cd bin
curl -o chromedriver.zip http://chromedriver.storage.googleapis.com/2.15/chromedriver_${ARCH}.zip
unzip chromedriver.zip
cd -
npm install

if [ "$MODE" = "_xvfb" ]; then
    xvfb-run -s '-screen 0 1024x768x8' npm test
else
    if [ "$MODE" = "_xnest" ]; then
        Xnest :1 & DISPLAY=:1 npm test
        pkill Xnest
    else
        npm test
    fi
fi

pkill -P $(pgrep -P $(pgrep install_dev.sh) start.sh)
rm -rf ${WORKDIR}
