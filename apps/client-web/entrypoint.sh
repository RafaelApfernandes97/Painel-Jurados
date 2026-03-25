#!/bin/sh
set -e

# Replace placeholders with runtime env vars in all JS files
find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
  -e "s|__VITE_API_URL__|${VITE_API_URL:-}|g" \
  -e "s|__VITE_SOCKET_URL__|${VITE_SOCKET_URL:-}|g" \
  -e "s|__VITE_JURY_URL__|${VITE_JURY_URL:-}|g" \
  {} +

exec nginx -g 'daemon off;'
