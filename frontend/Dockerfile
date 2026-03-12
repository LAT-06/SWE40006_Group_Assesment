# Stage 1: Build
FROM node:alpine AS build

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
