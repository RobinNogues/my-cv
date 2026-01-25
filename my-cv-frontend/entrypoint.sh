#!/bin/sh
set -e

if [ -z "$DOMAIN" ]; then
    echo "ERROR: DOMAIN environment variable is not set."
    exit 1
fi

HUGO_BASEURL="https://${DOMAIN}"

echo "==> Building site with Hugo (baseURL: $HUGO_BASEURL)..."

# Case-insensitive check for true
if [ "$(echo "$HOT_RELOAD" | tr '[:upper:]' '[:lower:]')" = "true" ]; then
    echo "Starting in DEVELOPMENT mode (Hugo Server)"
    # Clean previous build if any to avoid confusion
    rm -rf /usr/share/nginx/html/*
    # Start Hugo Server
    exec hugo server \
        --bind 0.0.0.0 \
        --baseURL "$HUGO_BASEURL" \
        --port 80 \
        --appendPort=false \
        --watch \
        --poll 700ms 
else
    echo "Starting in PRODUCTION mode (Static Build + Nginx)"
    hugo --minify --baseURL "$HUGO_BASEURL"

    echo "==> Copying generated files to Nginx..."
    cp -r /src/public/* /usr/share/nginx/html/

    echo "==> Starting Nginx..."
    exec nginx -g "daemon off;"
fi
