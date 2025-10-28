# Changelog - Captive Portal Network

## [v1.1.0] - 2024-10-28

### 🐳 Containerização com Docker

#### Novos Recursos

##### Docker e Docker Compose
- **`dockerfile`**: Imagem Docker otimizada para produção
  - Multi-stage build para reduzir tamanho da imagem
  - Base: Node.js 18 Alpine Linux (imagem leve)
  - iptables, bash, curl, dumb-init incluídos
  - Usuário não-root (captive:1001) para segurança
  - Healthcheck integrado com endpoint `/health`
  - ENTRYPOINT com dumb-init para gerenciamento de processos
  
- **`docker-compose.yml`**: Orquestração completa do sistema
  - Network mode: host (acesso direto às interfaces de rede)
  - Capabilities: NET_ADMIN e NET_RAW (necessários para iptables)
  - Volumes persistentes: data/, logs/, scripts/
  - Variáveis de ambiente configuráveis via .env
  - Healthcheck automático a cada 30 segundos
  - Restart policy: unless-stopped
  - Logging com rotação automática
  
- **`.dockerignore`**: Otimização do build
  - Exclui node_modules, documentação, arquivos IDE
  - Reduz tamanho do contexto de build
  - Build mais rápido e eficiente

##### Configuração
- **`.env.example`**: Template completo de variáveis de ambiente
  - Todas as configurações documentadas
  - Instruções para OAuth (Google/Facebook)
  - Configurações de rede (WAN/LAN interfaces)
  - Segurança (secrets, senhas)
  - Logging e monitoramento

##### Documentação
- **`docs/DEPLOYMENT_DOCKER.md`**: Guia completo de deployment com Docker
  - Instalação do Docker e Docker Compose
  - Arquitetura do sistema containerizado
  - Pré-requisitos e configuração de rede
  - Comandos Docker essenciais
  - Troubleshooting detalhado
  - Segurança e hardening
  - Monitoramento e logs
  - Deployment em produção com systemd

#### Melhorias

##### Segurança
- Container executa com usuário não-root
- Capabilities mínimas necessárias (NET_ADMIN, NET_RAW)
- Volumes com permissões apropriadas
- Scripts montados como read-only
- Healthcheck para detecção de falhas
- Graceful shutdown (SIGTERM/SIGINT)

##### Performance
- Multi-stage build reduz tamanho da imagem final
- Alpine Linux como base (imagem ~50MB menor)
- Cache de layers otimizado
- Network mode host (sem overhead de NAT)

##### Operacional
- Auto-restart em caso de falha
- Logs com rotação automática (10MB max, 3 arquivos)
- Healthcheck integrado
- Volumes persistentes para dados críticos
- Fácil escalabilidade e replicação

#### 📦 Dependências Atualizadas

##### Imagem Docker
- Node.js 18 (Alpine Linux)
- iptables / ip6tables
- bash
- curl (para healthcheck)
- dumb-init (gerenciador de processos)

#### ✅ Validações

- [x] Build da imagem Docker sem erros
- [x] Container inicia e responde ao healthcheck
- [x] Volumes persistentes funcionando
- [x] Acesso ao iptables do host via capabilities
- [x] Scripts shell executam corretamente dentro do container
- [x] Variáveis de ambiente carregadas do .env
- [x] Graceful shutdown funcionando

#### 🏗️ Arquitetura Docker

```
Host Linux (Ubuntu 22.04)
├── Docker Container (network_mode: host)
│   ├── Captive Portal App (Node.js)
│   │   ├── Express Server (:3000)
│   │   ├── SQLite Database
│   │   └── OAuth Integration
│   ├── Capabilities: NET_ADMIN, NET_RAW
│   └── Acesso direto ao iptables do host
├── iptables (gerenciado pelo container)
├── dnsmasq (DHCP - host)
├── eth0 (WAN) → Internet
└── eth1 (LAN) → AP → Clientes
```

#### 📋 Comandos Docker Essenciais

```bash
# Build e iniciar
docker compose build
docker compose up -d

# Logs
docker compose logs -f

# Parar/Reiniciar
docker compose down
docker compose restart

# Executar comandos no container
docker compose exec captive-portal sh

# Ver regras iptables (do host)
sudo iptables -L -n -v
```

---

## [v1.0.0] - 2024-10-28

### Implementação Técnica Completa

#### 🎯 Novos Recursos

##### Scripts de Firewall e Controle de Acesso
- **`scripts/setup-captive-firewall.sh`**: Script completo de configuração do firewall com iptables
  - Configura NAT (MASQUERADE) na interface WAN
  - Redireciona tráfego HTTP (porta 80) para o servidor Node.js (porta 3000) via DNAT
  - Configura regras FORWARD com política padrão DROP
  - Permite DNS (porta 53) e HTTPS para OAuth (porta 443)
  - Registra logs das tentativas de conexão bloqueadas
  
- **`scripts/allow_internet.sh`**: Script de liberação de acesso à internet
  - Aceita apenas endereço MAC como parâmetro
  - Valida formato do endereço MAC
  - Insere regra ACCEPT no iptables FORWARD para o MAC especificado
  - Registra ação no syslog com logger
  
- **`scripts/block_internet.sh`**: Script de bloqueio de acesso à internet
  - Aceita apenas endereço MAC como parâmetro
  - Valida formato do endereço MAC
  - Remove regra ACCEPT do iptables FORWARD para o MAC especificado
  - Registra ação no syslog com logger

##### Arquivos de Configuração
- **`config/netplan-example.yaml`**: Template de configuração de rede para Ubuntu Netplan
  - Interface WAN com DHCP
  - Interface LAN com IP estático 192.168.10.1/24
  - Comentários explicativos para facilitar a customização
  
- **`config/dnsmasq.conf`**: Configuração do servidor DHCP
  - Range DHCP: 192.168.10.100-254
  - Lease time: 12 horas
  - DNS forwarding para Google DNS (8.8.8.8/8.8.4.4)
  - Binding apenas na interface LAN
  
- **`config/captive-portal.service`**: Unit file systemd para a aplicação
  - Executa como usuário dedicado `captive-portal`
  - Auto-restart em caso de falha
  - Proteções de segurança (ProtectSystem, NoNewPrivileges)
  - Logging para systemd journal
  
- **`config/captive-firewall.service`**: Unit file systemd para o firewall
  - Serviço oneshot executado no boot
  - Dependência: executa antes do captive-portal.service
  - Garante que o firewall está configurado antes da aplicação iniciar

##### Scripts de Instalação
- **`scripts/install.sh`**: Script de instalação automatizada
  - Detecta Ubuntu 22.04 LTS
  - Instala dependências (Node.js 18+, iptables-persistent, dnsmasq)
  - Configura IP forwarding no kernel
  - Cria usuário de sistema dedicado
  - Copia arquivos para /opt/captive-portal
  - Configura permissões corretas
  - Configura e habilita serviços systemd
  - Exibe instruções pós-instalação
  
- **`INSTALL.md`**: Guia rápido de instalação
  - Pré-requisitos e hardware necessário
  - Comandos de instalação automatizada
  - Passos de configuração pós-instalação
  - Comandos de teste e validação
  - Seção de troubleshooting

#### 🔧 Melhorias

##### Atualização de Código da Aplicação
- **`src/routes/captive.js`**: Atualizado para chamar `allow_internet.sh` apenas com MAC
  - Removido parâmetro IP (não é necessário para iptables)
  - Adicionada validação de presença do MAC antes da chamada
  - Melhorado logging com informação do MAC liberado
  - Adicionado warning caso MAC não esteja disponível
  
- **`src/services/SessionExpirationService.js`**: Atualizado para chamar `block_internet.sh` apenas com MAC
  - Removido parâmetro IP
  - Adicionada validação de presença do MAC antes da chamada
  - Melhorado logging com informação do MAC bloqueado
  - Adicionado warning caso MAC não esteja disponível

#### 📚 Documentação

##### Nova Documentação
- **`docs/DEPLOYMENT_LINUX_UBUNTU.md`**: Guia completo de deployment em Ubuntu
  - Arquitetura de rede detalhada com diagramas Mermaid
  - Requisitos de hardware e software
  - Configuração passo a passo de todos os componentes
  - Configuração de Access Point em modo bridge
  - Troubleshooting completo
  - Comandos de validação e testes

##### Documentação Existente Atualizada
- **`docs/README.md`**: Atualizado índice com novos documentos
- Todos os arquivos de documentação revisados e validados

#### 🔒 Segurança

##### Melhorias de Segurança
- Scripts validam formato de endereço MAC antes de executar comandos
- Systemd service com proteções de filesystem (ProtectSystem=strict)
- NoNewPrivileges ativado para prevenir escalação de privilégios
- Execução com usuário dedicado sem privilégios (exceto sudo NOPASSWD para scripts específicos)
- PrivateTmp ativado para isolamento de arquivos temporários

#### 🏗️ Arquitetura

##### Topologia de Rede
```
Internet → Modem (bridge) → Gateway Linux (2 NICs) → AP (modo bridge) → Clientes Wi-Fi
                              ↑
                         Ubuntu 22.04
                         - iptables NAT
                         - dnsmasq DHCP
                         - Node.js App
```

##### Componentes Systemd
- **captive-firewall.service**: Inicializa firewall no boot
- **captive-portal.service**: Executa aplicação Node.js
- Ordem de inicialização: firewall → portal
- Auto-restart em caso de falha da aplicação

#### 📦 Dependências
- Node.js 18+
- iptables / iptables-persistent
- dnsmasq
- systemd (Ubuntu 22.04+)
- Netplan (gerenciamento de rede)

#### ✅ Validações
- Testes de sintaxe JavaScript (sem erros)
- Permissões de execução verificadas em todos os scripts
- Formato de configuração validado (Netplan, dnsmasq, systemd)
- Fluxo completo de autenticação e liberação de acesso testado logicamente

#### 📋 Checklist de Implementação
- [x] Scripts de firewall (setup, allow, block)
- [x] Arquivos de configuração (Netplan, dnsmasq, systemd)
- [x] Script de instalação automatizada
- [x] Atualização do código da aplicação (chamadas aos scripts)
- [x] Documentação de deployment
- [x] Guia rápido de instalação (INSTALL.md)
- [x] Permissões de execução nos scripts
- [x] Validação de sintaxe (sem erros)
- [x] Registro de alterações (CHANGELOG.md)

---

## Próximos Passos

### Testes em Ambiente Real
1. [ ] Configurar servidor Ubuntu 22.04 com 2 interfaces de rede
2. [ ] Executar script de instalação automatizada
3. [ ] Configurar variáveis de ambiente (OAuth, etc)
4. [ ] Testar fluxo completo de autenticação
5. [ ] Validar liberação/bloqueio de acesso via iptables
6. [ ] Testar expiração automática de sessões
7. [ ] Validar redirecionamento para Instagram após login

### Melhorias Futuras (Opcional)
- [ ] Dashboard de monitoramento em tempo real
- [ ] Relatórios de uso e estatísticas
- [ ] Suporte a múltiplas redes SSID
- [ ] API para integração com sistemas externos
- [ ] Interface de gerenciamento de usuários
- [ ] Backup automático do banco de dados
- [ ] Alertas por email/SMS em caso de problemas

---

## Notas Técnicas

### Mudança de Assinatura dos Scripts
Os scripts `allow_internet.sh` e `block_internet.sh` foram modificados para aceitar apenas o endereço MAC como parâmetro, em vez de IP e MAC. Esta mudança foi feita porque:

1. **Confiabilidade**: O endereço MAC é mais confiável para identificar dispositivos em uma rede local
2. **Simplicidade**: As regras iptables podem usar apenas o MAC com a flag `-m mac --mac-source`
3. **Persistência**: O IP pode mudar (DHCP), mas o MAC permanece constante
4. **Performance**: Menos parâmetros significa menos validações e processamento

### Estrutura de Diretórios da Instalação
```
/opt/captive-portal/
├── src/
├── public/
├── scripts/
├── node_modules/
├── package.json
├── database.sqlite
└── .env
```

### Comandos Úteis
```bash
# Verificar status do firewall
sudo iptables -L -n -v

# Verificar regras de NAT
sudo iptables -t nat -L -n -v

# Ver logs do sistema
sudo journalctl -u captive-portal -f
sudo journalctl -u captive-firewall -f

# Reiniciar serviços
sudo systemctl restart captive-portal
sudo systemctl restart captive-firewall

# Ver MACs autorizados
sudo iptables -L FORWARD -n -v | grep ACCEPT
```
