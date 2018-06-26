FROM ubuntu:14.04
MAINTAINER Pierre Chaussalet <pchaussalet@montagestudio.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN apt-get install -y nodejs && apt-get clean
RUN ln -s $(which nodejs) /usr/local/bin/node
RUN npm install -g pm2


ADD start_services.sh /opt/start_services.sh

ADD apps /opt/apps
WORKDIR /opt/apps
RUN npm install --production
RUN ln -sf /opt/config/apps/config.js

ADD auth /opt/auth
WORKDIR /opt/auth
RUN npm install --production
RUN ln -sf /opt/config/auth/config.js

ADD jira /opt/jira
WORKDIR /opt/jira
RUN npm install --production
RUN ln -sf /opt/config/jira/config.js

ADD logging /opt/logging
WORKDIR /opt/logging
RUN npm install --production
RUN ln -sf /opt/config/logging/config.js

ADD rendezvous /opt/rendezvous
WORKDIR /opt/rendezvous
RUN npm install --production

ADD router /opt/router
WORKDIR /opt/router
RUN npm install --production
RUN ln -sf /opt/config/router/config.js

ADD storage /opt/storage
WORKDIR /opt/storage
RUN npm install --production
RUN ln -sf /opt/config/storage/config.js

RUN apt-get autoremove -y npm

EXPOSE 8080 9090 9615

CMD ["/opt/start_services.sh"]
