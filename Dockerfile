FROM node:alpine

WORKDIR /transcendence

COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]