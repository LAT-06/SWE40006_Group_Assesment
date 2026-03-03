FROM node:alpine

ENV SUPABASE_URL=
ENV SUPABASE_ANON_KEY=

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
