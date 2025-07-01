# Utiliser l'image Nginx officielle et légère comme base
FROM nginx:alpine

# Copier le fichier de configuration principal de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier le template de configuration du vhost.
# Il sera traité au démarrage du conteneur.
COPY conf.d/default.conf.template /etc/nginx/templates/default.conf.template

# Copier le script d'entrypoint qui préparera la configuration
COPY entrypoint.sh /docker-entrypoint.sh

# Rendre le script d'entrypoint exécutable
RUN chmod +x /docker-entrypoint.sh

# Exposer les ports HTTP et HTTPS
EXPOSE 80
EXPOSE 443

# Définir notre script comme point d'entrée
ENTRYPOINT ["/docker-entrypoint.sh"]

# La commande par défaut à exécuter après le script d'entrypoint
CMD ["nginx", "-g", "daemon off;"]