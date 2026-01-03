# Reservaya Backend Docker Image
# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Install OpenSSL for Prisma build
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy all files first (including prisma schema)
COPY . .

# Install dependencies (postinstall will now work since prisma schema is present)
RUN npm install

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
