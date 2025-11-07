# builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

# runtime stage
FROM node:18-alpine AS runner
STOPSIGNAL SIGTERM
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/src/generated/prisma /app/src/generated/prisma

ENV NODE_ENV=production
ENV COOKIE_SECURE=true
EXPOSE ${APP_PORT}

CMD ["node", "dist/scripts/entrypoint.js"]
