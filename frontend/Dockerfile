FROM node:alpine AS build

ENV VITE_SUPABASE_URL=
ENV VITE_SUPABASE_ANON_KEY=
ENV VITE_API_URL=

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
