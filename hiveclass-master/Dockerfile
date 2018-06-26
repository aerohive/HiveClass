FROM ubuntu:14.04
MAINTAINER Pierre Chaussalet <pchaussalet@montagestudio.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get install -y nodejs && \
    apt-get clean

ADD . /srv/server
WORKDIR /srv/server

EXPOSE 8888

CMD ["./reset.sh", "-f"]
