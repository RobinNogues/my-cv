# Standalone CV Frontend Image
# Contains Hugo (builder) + Nginx (server)
# Content (content.yaml) is injected at runtime via volume mount

FROM hugomods/hugo:exts AS hugo-base

FROM nginx:alpine

# Install Hugo from the hugo-base stage
COPY --from=hugo-base /usr/bin/hugo /usr/local/bin/hugo

WORKDIR /src

# Copy theme and configuration (but NOT the data/content.yaml)
COPY hugo.yaml .
COPY themes/ themes/
COPY static/ static/

# Create empty data directory (content will be mounted here)
RUN mkdir -p data

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
