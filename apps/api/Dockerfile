FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS dev
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "-w", "@recipe-finder/api"]

FROM base AS build
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY . .
RUN npm run build -w @recipe-finder/api

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/.output ./.output
EXPOSE 3001
USER node
CMD ["node", ".output/server/index.mjs"]
