# Use the official Node.js image as the base image
FROM node:16

# Create app directory
WORKDIR /home/akshith/Desktop/aggregations

# Install app dependencies
COPY package*.json ./

RUN npm install -g nodemon
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD ["nodemon", "app.js"]
