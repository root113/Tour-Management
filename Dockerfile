# builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json prisma ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# runtime stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE ${APP_PORT}
CMD ["node", "dist/scripts/entrypoint.js"]
