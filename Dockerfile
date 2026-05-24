# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Compile the TypeScript Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ==========================================
# Stage 3: Production Runtime Environment
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app/backend

# Install production dependencies only
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy compiled backend code
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend assets to the location served by backend
COPY --from=frontend-builder /app/frontend/dist ./frontend

# Create storage and config volumes
RUN mkdir -p /app/storage /app/config

# Copy default theme configuration template directly to CONFIG_DIR
COPY config/theme.json /app/config/theme.json

# Configure runtime details
ENV PORT=8080
ENV NODE_ENV=production
ENV STORAGE_DIR=/app/storage
ENV CONFIG_DIR=/app/config

EXPOSE 8080

CMD ["node", "dist/index.js"]
