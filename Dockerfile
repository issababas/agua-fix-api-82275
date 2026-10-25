# ── Etapa 1: dependencias de producción ───────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copiar solo manifiestos para aprovechar el caché de capas
COPY package.json package-lock.json ./

# Instalación reproducible, solo dependencias de producción
RUN npm ci --omit=dev --ignore-scripts

# ── Etapa 2: compilación ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Todas las dependencias (incluyendo dev) para compilar
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Código fuente
COPY . .

# Compilar TypeScript → dist/
RUN npm run build

# ── Etapa 3: imagen final (solo runtime) ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Usuario sin privilegios
USER node

# Dependencias de producción instaladas en la etapa deps
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Código compilado
COPY --from=builder --chown=node:node /app/dist ./dist

# El puerto lo define la variable de entorno PORT (default 3000)
EXPOSE 3000

CMD ["node", "dist/main"]
