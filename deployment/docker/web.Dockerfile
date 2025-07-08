# Dockerfile for Elyte Platform Web App

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files (if using a build system)
# COPY package*.json ./
# RUN npm ci --only=production

# Copy web application files
COPY web-app/ ./

# Production stage - use nginx to serve static files
FROM nginx:alpine

# Copy custom nginx configuration
COPY deployment/docker/nginx.conf /etc/nginx/nginx.conf

# Copy web application files
COPY --from=builder /app /usr/share/nginx/html

# Create non-root user
RUN adduser -D -S -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]