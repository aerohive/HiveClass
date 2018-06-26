#!/bin/bash

usage()
{
cat << EOF
usage: $0 -t <RELEASE_TYPE>

This script release a new version of the application

OPTIONS:
   -h      Show this message
   -t      Release type, can be 'patch', 'minor' or 'major'
EOF
}

update_file()
{
    FILE=$1
    mv ${FILE} ${FILE}.old
    cat ${FILE}.old | jq --arg new_version ${NEW_VERSION} '.version = $new_version' > ${FILE}
    rm ${FILE}.old
    git add ${FILE}
}

update_version()
{
    update_file package.json
    if [ -e manifest.json ]; then
        update_file manifest.json
    fi
}

RELEASE_TYPE=
while getopts "ht:" OPTION; do
    case ${OPTION} in
        h)
            usage
            exit 1
            ;;
        t)
            RELEASE_TYPE=$OPTARG
            ;;
    esac
done

if [ -z ${RELEASE_TYPE} ] || { [ ${RELEASE_TYPE} != "patch" ] && [ ${RELEASE_TYPE} != "minor" ] && [ ${RELEASE_TYPE} != "major" ]; }; then
    usage
    exit 1
fi

OLD_VERSION=$(cat package.json | jq .version | sed 's/"//g')
NEW_VERSION=$(semver -i ${RELEASE_TYPE} ${OLD_VERSION})

echo "Bumping version from ${OLD_VERSION} to ${NEW_VERSION}"
for module in login student teacher extensions/student extensions/teacher; do
    echo ${module}
    cd ${module}
    update_version
    cd -
done
git commit -m "Updating to version ${NEW_VERSION}"

npm version ${NEW_VERSION} && \
git checkout qa && \
git merge v${NEW_VERSION} && \
git push && \
git checkout master
