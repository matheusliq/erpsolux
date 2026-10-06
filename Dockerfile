FROM node:20-alpine AS builder

# Required for Prisma engine on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source
COPY . .

# Build Next.js with placeholder env vars for static analysis
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:dummy@localhost:5432/postgres"
ENV DIRECT_URL="postgresql://postgres:dummy@localhost:5432/postgres"
ENV NEXTAUTH_SECRET="solux-build-placeholder-secret-12345"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
