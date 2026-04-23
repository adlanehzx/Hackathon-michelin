FROM node:20.19.4 AS base

WORKDIR /app

COPY package*.json ./

FROM base AS builder

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build && ls -la dist/

FROM builder AS dev

CMD ["npm", "run", "dev"]

FROM node:20.19.4 AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
