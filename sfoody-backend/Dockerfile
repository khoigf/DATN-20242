FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["sh", "-c", "node ./scripts/syncToMeili.js && npm start"]