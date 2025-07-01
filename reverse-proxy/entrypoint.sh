#!/bin/sh

# Arrête le script si une commande échoue
set -e

# Remplace les variables d'environnement dans le template et crée le fichier de conf final.
# Les variables à substituer doivent être listées pour éviter de remplacer des variables internes à Nginx (ex: $host).
envsubst '$NGINX_HOST $SSL_CERTIFICATE_PATH $SSL_CERTIFICATE_KEY_PATH' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Exécute la commande passée en argument au script (le CMD du Dockerfile)
exec "$@"