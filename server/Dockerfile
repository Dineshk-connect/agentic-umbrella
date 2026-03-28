FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["node", "index.js"]