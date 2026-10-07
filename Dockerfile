# ==============================================================================
# STAGE 1 : Compilation du Frontend Nuxt (Vue.js) en Statique
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Activation de corepack et pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dépendances de build
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# Code source
COPY . .

# Génération statique vers dist/
RUN pnpm run generate

# ==============================================================================
# STAGE 2 : Image de Production Nginx (ultra-légère)
# ==============================================================================
FROM nginx:alpine

# Configuration Nginx avec gestion SPA et compression gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques compilés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
