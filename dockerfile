# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências de build
RUN apk add --no-cache python3 make g++

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine

# Instalar iptables e outras ferramentas necessárias
RUN apk add --no-cache \
    iptables \
    ip6tables \
    bash \
    curl \
    dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S captive && \
    adduser -u 1001 -S captive -G captive

WORKDIR /app

# Copiar dependências da stage de build
COPY --from=builder --chown=captive:captive /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=captive:captive . .

# Copiar e tornar executável o entrypoint
COPY --chown=captive:captive docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh /app/scripts/*.sh

# Criar diretório para o banco de dados
RUN mkdir -p /app/data && chown captive:captive /app/data

# Variáveis de ambiente
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/database.sqlite

# Expor porta da aplicação
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Usar entrypoint customizado que configura firewall
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/app/docker-entrypoint.sh"]

# Executar como usuário não-root
USER captive

# Comando de início
CMD ["node", "src/server.js"]