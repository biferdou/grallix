FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY pnpm-lock.yaml package.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN pnpm run build

# Command to run the app
CMD ["node", "dist/index.js"]