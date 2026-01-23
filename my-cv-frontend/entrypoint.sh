#!/bin/sh
set -e

HUGO_BASEURL="${HUGO_BASEURL:-http://localhost}"

echo "==> Building site with Hugo (baseURL: $HUGO_BASEURL)..."
hugo --minify --baseURL "$HUGO_BASEURL"

echo "==> Copying generated files to Nginx..."
cp -r /src/public/* /usr/share/nginx/html/

echo "==> Starting Nginx..."
exec nginx -g "daemon off;"
