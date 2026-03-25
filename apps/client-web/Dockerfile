# ---- Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY apps/client-web/package*.json ./
RUN npm ci

COPY frontend /frontend
COPY apps/client-web ./

# Placeholder values — replaced at runtime by entrypoint.sh
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_SOCKET_URL=__VITE_SOCKET_URL__
ENV VITE_JURY_URL=__VITE_JURY_URL__

RUN npm run build

# ---- Runtime ----
FROM nginx:alpine

COPY apps/client-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY apps/client-web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
