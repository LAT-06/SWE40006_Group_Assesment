# Stage 1: Build
FROM dhi.io/node:25-debian12-dev AS build

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json* ./
RUN ["npm", "ci"]

COPY . ./
RUN ["npm", "run", "build"]

# Stage 2: Serve
FROM dhi.io/nginx:1-debian12

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["-g", "daemon off;"]
