# Multi-stage build for Hiring-Predictor

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install Python for resume parser
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Install Python dependencies
COPY scripts/resume-parser/requirements.txt ./scripts/resume-parser/
RUN pip3 install --no-cache-dir -r scripts/resume-parser/requirements.txt

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY python ./python
COPY scripts ./scripts
COPY migrations ./migrations
COPY drizzle.config.ts ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.cjs"]
