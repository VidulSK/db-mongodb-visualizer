# Stage 1: Build the frontend React application
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve API routes and compiled client bundle
FROM node:20-alpine
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --only=production

COPY backend/ ./backend/

# Copy the compiled frontend bundle from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Railway exposes PORT automatically)
EXPOSE 5000

ENV NODE_ENV=production

# Start the Node.js Express server
CMD ["node", "backend/server.js"]
