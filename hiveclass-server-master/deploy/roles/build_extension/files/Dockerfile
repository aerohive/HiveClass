FROM ubuntu:14.04
MAINTAINER Pierre Chaussalet <pchaussalet@montagestudio.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get install -y chromium-browser libexif-dev xvfb && apt-get clean
ADD build_extension.sh /opt/build_extension.sh
