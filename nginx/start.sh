#!/bin/sh
set -eu

DOMAIN="${DOMAIN:?DOMAIN environment variable is required}"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  TEMPLATE="/etc/nginx/templates/app.conf.tls.template"
else
  TEMPLATE="/etc/nginx/templates/app.conf.http-only.template"
fi

envsubst '${DOMAIN}' < "${TEMPLATE}" > /etc/nginx/conf.d/default.conf
nginx -t
exec nginx -g 'daemon off;'
