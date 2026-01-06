FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY conf.d/default.conf.template /etc/nginx/templates/default.conf.template

COPY entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
