# ---- Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY apps/jury-web/package*.json ./
RUN npm ci

COPY frontend /frontend
COPY apps/jury-web ./

# Placeholder values — replaced at runtime by entrypoint.sh
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_SOCKET_URL=__VITE_SOCKET_URL__

RUN npm run build

# ---- Runtime ----
FROM nginx:alpine

COPY apps/jury-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY apps/jury-web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
