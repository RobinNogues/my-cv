# Stage 1: Development with Hugo server & live-reload
FROM hugomods/hugo:exts AS dev

ARG FA_VERSION=6.7.2
ARG FA_SHA256=794284b4ac7f3e30825bbeea1a073f542c45dff83f8146625f600f1015c9d52b

WORKDIR /src

# Download official FontAwesome Free SVGs once in the builder/dev layer so
# content.yaml can reference any FA 6 icon without committing 2,000+ SVGs
# to git or shipping webfonts/unused assets in the final nginx image.
RUN wget -qO /tmp/fa.tgz "https://registry.npmjs.org/@fortawesome/fontawesome-free/-/fontawesome-free-${FA_VERSION}.tgz" \
    && echo "${FA_SHA256}  /tmp/fa.tgz" | sha256sum -c - \
    && tar -xz -C /tmp -f /tmp/fa.tgz \
    && mkdir -p /src/assets/fontawesome-svgs \
    && mv /tmp/package/svgs/* /src/assets/fontawesome-svgs/ \
    && rm -rf /tmp/package /tmp/fa.tgz

COPY my-cv-frontend/themes/ themes/

EXPOSE 80

CMD ["hugo", "server", "--bind", "0.0.0.0", "--port", "80", "--appendPort=false", "--watch", "--poll", "1000ms"]

# Stage 2: Production site builder
FROM dev AS builder

COPY hugo.yaml ./hugo.yaml
COPY content.yaml ./data/content.yaml

RUN hugo --minify

# Stage 3: Production runtime - pure lightweight Nginx
FROM nginx:alpine AS prod

COPY --from=builder /src/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
