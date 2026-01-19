# Build stage with Hugo Extended (for SCSS support)
FROM hugomods/hugo:exts AS builder

WORKDIR /src
COPY . .

# Build the site
RUN hugo --minify

# Production stage
FROM nginx:alpine

# Copy built site from builder
# Copy built site from builder
COPY --from=builder /src/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
