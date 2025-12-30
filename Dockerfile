FROM node:25-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_USE_MOCK_ADAPTERS
ARG VITE_APP_VERSION

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK_ADAPTERS=$VITE_USE_MOCK_ADAPTERS
ENV VITE_APP_VERSION=$VITE_APP_VERSION

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.d/99-env-config.sh
RUN chmod +x /docker-entrypoint.d/99-env-config.sh

COPY docker/env-config.template.js /usr/share/nginx/html/env-config.template.js
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
