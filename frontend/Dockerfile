# Stage 1: Build frontends
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package descriptors first to leverage docker caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared-ui/package.json ./packages/shared-ui/
COPY apps/host-shell/package.json ./apps/host-shell/
COPY apps/remote-catalog/package.json ./apps/remote-catalog/
COPY apps/remote-dashboard/package.json ./apps/remote-dashboard/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the codebase
COPY . .

# Build arguments to configure domain paths dynamically
ARG VITE_APP_URL=""
ARG VITE_API_URL=""

ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_API_URL=$VITE_API_URL

# Build all monorepo microfrontend targets
RUN pnpm build

# Stage 2: Setup Nginx container
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/apps/host-shell/dist /usr/share/nginx/html/host-shell
COPY --from=builder /app/apps/remote-catalog/dist /usr/share/nginx/html/remote-catalog
COPY --from=builder /app/apps/remote-dashboard/dist /usr/share/nginx/html/remote-dashboard

# Expose ports
EXPOSE 5000 5001 5002

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
