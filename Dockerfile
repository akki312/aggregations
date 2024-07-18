FROM node:16.13.0
WORKDIR /home/akshith/Desktop/aggregations
RUN npm i -g nodemon
COPY ./package.json .
RUN npm install
RUN apt-get update && apt-get install -y --no-install-recommends procps

COPY . .
EXPOSE 3001
CMD npm start