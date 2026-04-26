FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS dev
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "@recipe-finder/web", "--", "--host", "0.0.0.0"]

FROM base AS build
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY . .
RUN npm run build -w @recipe-finder/web

FROM nginx:1.27-alpine AS prod
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
