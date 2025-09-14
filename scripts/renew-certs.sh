#!/bin/bash

cd "$(dirname "$0")/.."

LOG_FILE="cron-certbot.log"

log_message() {
    echo "$(date) : $1" >> "$LOG_FILE"
}

log_message "Start of HTTPS certificate renewal"

OUTPUT=$(/usr/bin/docker compose run --rm certbot renew 2>&1)

if echo "$OUTPUT" | grep -qE "Congratulations|renewed"; then
    log_message "Certificates renewed. Restarting Nginx..."
    /usr/bin/docker compose restart reverse-proxy >> "$LOG_FILE" 2>&1
    log_message "Nginx restarted."
else
    log_message "Certificates not renewed (no action needed)."
fi

log_message "End of HTTPS certificate renewal"