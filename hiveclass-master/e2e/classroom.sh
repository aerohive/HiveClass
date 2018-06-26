#!/bin/bash

STUDENTS_COUNT=$1
DOMAIN=$2

echo "Launching classroom on domain $DOMAIN with $STUDENTS_COUNT student(s)"

rm -rf /tmp/access_code
xnest.sh 10 node teacher.js > /tmp/access_code &

while [ ! -s /tmp/access_code ]; do
  sleep 0.5
done

ACCESS_CODE=$(cat /tmp/access_code)

echo "Access code: $ACCESS_CODE"

for (( i=0; i<$STUDENTS_COUNT; i++ )); do
  sleep 1
  xnest.sh 2$i node student.js http://${DOMAIN}/apps/student $ACCESS_CODE &
done

sleep 3600
