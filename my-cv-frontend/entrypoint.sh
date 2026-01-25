#!/bin/sh
set -e

if [ -z "$DOMAIN" ]; then
    echo "ERROR: DOMAIN environment variable is not set."
    exit 1
fi

HUGO_BASEURL="https://${DOMAIN}"

echo "==> Building site with Hugo (baseURL: $HUGO_BASEURL)..."
hugo --minify --baseURL "$HUGO_BASEURL"

echo "==> Copying generated files to Nginx..."
cp -r /src/public/* /usr/share/nginx/html/

echo "==> Starting Nginx..."
exec nginx -g "daemon off;"
