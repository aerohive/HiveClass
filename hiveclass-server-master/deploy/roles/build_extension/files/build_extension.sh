#!/bin/sh
TARGET=$1
if [ -f /src/${TARGET}.pem ]; then
    KEY_ARG=--pack-extension-key=/src/${TARGET}.pem
fi
xvfb-run --server-args='-screen 0, 1024x768x24' chromium-browser --no-sandbox --pack-extension=/src/${TARGET} $KEY_ARG
