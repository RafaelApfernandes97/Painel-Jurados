#!/bin/sh
set -e

# Replace placeholders with runtime env vars in all JS files
find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
  -e "s|__VITE_API_URL__|${VITE_API_URL:-}|g" \
  {} +

exec nginx -g 'daemon off;'
