# Stage 1: Build and bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and esbuild config
COPY package*.json esbuild.config.js ./

# Install dependencies including dev dependencies for esbuild
RUN npm ci --omit=dev

# Copy source code
COPY src ./src

# Build using esbuild
RUN npm install esbuild && node esbuild.config.js

# Stage 2: Final minimal image
FROM node:22-alpine

WORKDIR /app

# Copy only the bundled application
COPY --from=builder /app/dist/app.js ./app.js

# Set production environment
ENV NODE_ENV=production \
    PORT=3000

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Start the bundled application
CMD ["node", "app.js"]

