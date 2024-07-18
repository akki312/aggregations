# Use the official Node.js image as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install -g nodemon && npm install

# Copy the rest of the application code
COPY . .

# Expose the port the application runs on
EXPOSE 3000

# Start the application with nodemon
CMD ["nodemon", "app.js"]
