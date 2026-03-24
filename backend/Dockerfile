FROM dhi.io/node:25-debian12-dev AS build

ENV SUPABASE_URL=
ENV SUPABASE_ANON_KEY=

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force

FROM dhi.io/node:25-debian12 AS runtime
ENV NODE_ENV=production
ENV SUPABASE_URL=
ENV SUPABASE_ANON_KEY=
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/apps/server/start.js"]
