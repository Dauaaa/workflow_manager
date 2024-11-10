FROM nginx:1.27

ARG DIST_DIR=dist
ARG CONFIG_DIR=.

COPY ${CONFIG_DIR}/default.conf /etc/nginx/conf.d/default.conf
COPY ${DIST_DIR} /usr/share/nginx/html
