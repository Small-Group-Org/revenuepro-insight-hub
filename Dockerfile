# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
# This layer will only rebuild if package.json or bun.lockb changes
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
# This layer will only rebuild if package files change
RUN npm ci

# Accept build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy source code in layers for better caching
# Copy configuration files first (they change less frequently)
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY eslint.config.js ./

# Copy public assets (they change less frequently)
COPY public/ ./public/

# Copy source code (this will trigger rebuild when source changes)
COPY src/ ./src/
COPY index.html ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 