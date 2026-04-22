FROM node:20.19.4

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./
COPY app.json ./

# Configurer npm avec timeouts plus longs et retries
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --legacy-peer-deps && \
    npx expo install react-dom react-native-web

# Copier tout le code
COPY . .

# Exposer les ports Expo
EXPOSE 8081 19000 19001

# Démarrer Expo web
CMD ["npx", "expo", "start", "--web"]
