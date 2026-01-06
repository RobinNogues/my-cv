#!/bin/sh

set -e

envsubst '$NGINX_HOST $SSL_CERTIFICATE_PATH $SSL_CERTIFICATE_KEY_PATH' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
