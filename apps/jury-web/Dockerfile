FROM node:20-alpine AS build

WORKDIR /app

COPY apps/jury-web/package*.json ./
RUN npm ci

COPY frontend /frontend
COPY apps/jury-web ./

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

FROM nginx:alpine

COPY apps/jury-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
