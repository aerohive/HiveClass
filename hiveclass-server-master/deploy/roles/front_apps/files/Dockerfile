FROM ubuntu:14.04
MAINTAINER Pierre Chaussalet <pchaussalet@montagestudio.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get install -y npm git && apt-get clean

ADD login /srv/www/login
ADD common /srv/www/login/common
WORKDIR /srv/www/login
RUN npm install --production

ADD student /srv/www/student
ADD common /srv/www/student/common
WORKDIR /srv/www/student
RUN npm install --production

ADD teacher /srv/www/teacher
ADD common /srv/www/teacher/common
WORKDIR /srv/www/teacher
RUN npm install --production

RUN apt-get autoremove -y npm

VOLUME /srv/www

CMD ["echo", "www"]
