#1 Build Stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# RUN npm install
# for slow intenet connection
RUN npm install --network-timeout=600000 



# Copy rest of backend code
COPY . .
RUN npm run build
RUN npx prisma generate

#2 Production Stage

FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env.production  .env
COPY --from=builder /app/prisma ./prisma  

RUN npx prisma generate


# Expose backend port
EXPOSE 4000

# Start the backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index"]
