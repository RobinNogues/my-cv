# Stage 1: Development with Hugo server & live-reload
FROM hugomods/hugo:exts AS dev

WORKDIR /src

COPY my-cv-frontend/themes/ themes/
COPY my-cv-frontend/static/ static/

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
