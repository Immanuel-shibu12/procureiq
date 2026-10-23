# ========================================================================
# MediProcureIQ: Backend API Service Dockerfile
# Production-ready Node.js container for Express REST API & MongoDB Engine
# ========================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install OS dependencies for potential node native modules
RUN apk add --no-cache curl python3 make g++

# Copy package descriptors for optimized layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set environment defaults
ENV PORT=5000
ENV NODE_ENV=production

# Expose backend REST port
EXPOSE 5000

# Continuous container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start production API server
CMD ["node", "server.js"]
