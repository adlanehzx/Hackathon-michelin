FROM node:20.19.4

WORKDIR /app

COPY package*.json ./
COPY app.json ./

RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --legacy-peer-deps && \
    npm install @react-native-async-storage/async-storage@2.2.0 --legacy-peer-deps && \
    npx expo install react-dom react-native-web

COPY . .

EXPOSE 8081 19000 19001 19002 19006

CMD ["npm", "run", "start"]
