# Use an official Node.js runtime as the base image (Alpine variant for smaller size)
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package definition files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the application source code
COPY . .

# Expose the application port (for documentation - Kubernetes will handle port mapping)
EXPOSE 4000

# Start the Node.js application
CMD ["node", "src/server.js"]
