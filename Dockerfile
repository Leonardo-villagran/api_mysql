# Dockerfile
FROM node:20.18    

WORKDIR /app

COPY package*.json ./

RUN npm install  

COPY . .

EXPOSE 3366

CMD ["node", "index.js"]