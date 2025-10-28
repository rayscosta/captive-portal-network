# Makefile para Captive Portal Network
# Facilita comandos Docker e operações comuns

.PHONY: help build up down restart logs shell status clean healthcheck iptables backup

# Variáveis
COMPOSE := docker compose
SERVICE := captive-portal

# Help - mostra todos os comandos disponíveis
help:
	@echo "════════════════════════════════════════════════════════"
	@echo "  Captive Portal Network - Comandos Make"
	@echo "════════════════════════════════════════════════════════"
	@echo ""
	@echo "Comandos Docker:"
	@echo "  make build       - Build da imagem Docker"
	@echo "  make up          - Iniciar container em background"
	@echo "  make down        - Parar e remover container"
	@echo "  make restart     - Reiniciar container"
	@echo "  make logs        - Ver logs em tempo real"
	@echo "  make shell       - Abrir shell no container"
	@echo "  make status      - Ver status do container"
	@echo ""
	@echo "Operações:"
	@echo "  make healthcheck - Testar endpoint /health"
	@echo "  make iptables    - Ver regras iptables"
	@echo "  make backup      - Fazer backup do banco de dados"
	@echo "  make clean       - Limpar containers e volumes"
	@echo ""
	@echo "Desenvolvimento:"
	@echo "  make install     - Instalar dependências (npm)"
	@echo "  make dev         - Executar em modo desenvolvimento"
	@echo "  make test        - Executar testes"
	@echo ""
	@echo "════════════════════════════════════════════════════════"

# Build - construir a imagem Docker
build:
	@echo "🔨 Building Docker image..."
	$(COMPOSE) build

# Build sem cache (útil após mudanças no Dockerfile)
rebuild:
	@echo "🔨 Rebuilding Docker image (no cache)..."
	$(COMPOSE) build --no-cache

# Up - iniciar container
up:
	@echo "🚀 Starting container..."
	$(COMPOSE) up -d
	@echo "✅ Container started!"
	@echo "📊 Access: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:3000/api-docs"

# Up com rebuild
up-build:
	@echo "🔨 Building and starting container..."
	$(COMPOSE) up -d --build

# Down - parar container
down:
	@echo "🛑 Stopping container..."
	$(COMPOSE) down

# Restart - reiniciar container
restart:
	@echo "🔄 Restarting container..."
	$(COMPOSE) restart
	@echo "✅ Container restarted!"

# Logs - ver logs em tempo real
logs:
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	$(COMPOSE) logs -f $(SERVICE)

# Logs com últimas 100 linhas
logs-tail:
	@echo "📋 Showing last 100 log lines..."
	$(COMPOSE) logs --tail=100 $(SERVICE)

# Shell - abrir shell no container
shell:
	@echo "🐚 Opening shell in container..."
	$(COMPOSE) exec $(SERVICE) sh

# Status - ver status do container
status:
	@echo "📊 Container status:"
	$(COMPOSE) ps
	@echo ""
	@echo "💾 Resource usage:"
	@docker stats --no-stream $(SERVICE)-app 2>/dev/null || echo "Container not running"

# Healthcheck - testar endpoint /health
healthcheck:
	@echo "🏥 Testing health endpoint..."
	@curl -f http://localhost:3000/health && echo "\n✅ Health check passed!" || echo "\n❌ Health check failed!"

# iptables - ver regras iptables do host
iptables:
	@echo "🔥 Current iptables rules:"
	@echo ""
	@echo "=== FILTER TABLE ==="
	@sudo iptables -L -n -v
	@echo ""
	@echo "=== NAT TABLE ==="
	@sudo iptables -t nat -L -n -v
	@echo ""
	@echo "=== FORWARD CHAIN (authorized MACs) ==="
	@sudo iptables -L FORWARD -n -v | grep ACCEPT

# Backup - fazer backup do banco de dados
backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@$(COMPOSE) exec $(SERVICE) cp /app/data/database.sqlite /app/data/backup-$(shell date +%Y%m%d-%H%M%S).sqlite
	@echo "✅ Backup created!"

# Clean - limpar containers, images e volumes
clean:
	@echo "🧹 Cleaning up..."
	$(COMPOSE) down -v
	@docker system prune -f
	@echo "✅ Cleanup complete!"

# Clean completo - remove também as imagens
clean-all:
	@echo "🧹 Complete cleanup (including images)..."
	$(COMPOSE) down -v --rmi all
	@docker system prune -af
	@echo "✅ Complete cleanup done!"

# Install - instalar dependências localmente
install:
	@echo "📦 Installing npm dependencies..."
	@npm install

# Dev - executar em modo desenvolvimento (sem Docker)
dev:
	@echo "🚀 Starting in development mode..."
	@npm run dev

# Test - executar testes
test:
	@echo "🧪 Running tests..."
	@npm test

# Env - copiar .env.example para .env
env:
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file from template..."; \
		cp .env.example .env; \
		echo "✅ .env created! Please edit it with your values."; \
	else \
		echo "⚠️  .env already exists!"; \
	fi

# Setup - configuração inicial completa
setup: env
	@echo "🔧 Running initial setup..."
	@mkdir -p data logs
	@chmod +x scripts/*.sh
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Edit .env with your configuration"
	@echo "2. Run 'make build' to build the Docker image"
	@echo "3. Run 'make up' to start the container"

# Stats - ver estatísticas de uso
stats:
	@echo "📊 Container statistics:"
	@docker stats $(SERVICE)-app

# Inspect - inspecionar container
inspect:
	@echo "🔍 Container inspection:"
	@docker inspect $(SERVICE)-app

# Exec - executar comando no container
# Uso: make exec CMD="ls -la"
exec:
	@$(COMPOSE) exec $(SERVICE) $(CMD)

# DB - acessar banco de dados SQLite
db:
	@echo "💾 Opening SQLite database..."
	@$(COMPOSE) exec $(SERVICE) sqlite3 /app/data/database.sqlite

# Version - mostrar versões
version:
	@echo "📦 Version information:"
	@echo ""
	@echo "Docker:"
	@docker --version
	@echo ""
	@echo "Docker Compose:"
	@docker compose version
	@echo ""
	@echo "Node.js (host):"
	@node --version 2>/dev/null || echo "Not installed on host"
	@echo ""
	@echo "Node.js (container):"
	@$(COMPOSE) exec $(SERVICE) node --version 2>/dev/null || echo "Container not running"

# Update - atualizar dependências
update:
	@echo "📦 Updating npm dependencies..."
	@npm update
	@echo "🔨 Rebuilding Docker image..."
	@$(COMPOSE) build --no-cache
	@echo "✅ Update complete!"

# Deploy - deploy completo (pull, build, up)
deploy:
	@echo "🚀 Deploying..."
	@git pull
	@$(COMPOSE) down
	@$(COMPOSE) build
	@$(COMPOSE) up -d
	@echo "✅ Deployment complete!"
	@make healthcheck
