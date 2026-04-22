FROM node:20.19.4 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Compiler TypeScript, avec output des erreurs
RUN npm run build && ls -la dist/

# --- Production stage ---
FROM node:20.19.4

WORKDIR /app

COPY package*.json ./

# Installer UNIQUEMENT les dépendances de production
RUN npm install --legacy-peer-deps --production

# Copier le code compilé depuis builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
