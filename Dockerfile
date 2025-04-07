FROM node:20-alpine AS builder

# Install necessary packages for building
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json for client and server
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies for client and server
RUN cd client && npm ci
RUN cd server && npm ci

# Copy source code
COPY . .

# Build client and server
RUN cd client && npm run build
RUN cd server && npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Install gource, ffmpeg and git
RUN apk add --no-cache gource ffmpeg git

# Set working directory
WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/client/build ./client/build
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/

# Install production dependencies for server
RUN cd server && npm ci --only=production

# Create directory for data persistence
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/dist/index.js"] 