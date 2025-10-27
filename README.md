# captive-portal-network

Sistema acadêmico de gerenciamento de ativos de TI e captive portal com autenticação social.

## 📋 Documentação

- **[Instruções para GitHub Copilot](.github/copilot-instructions.md)** - Regras de negócio detalhadas e orientações de desenvolvimento
- **[Documentação Técnica](docs/)** - Arquitetura, APIs, modelos de domínio e fluxos

## 🚀 Como rodar

1. Copie `.env.example` para `.env` e ajuste valores.
2. Instale as dependências com npm.
3. Execute a migração do banco de dados (se já existir um banco antigo).
4. Crie um usuário administrador.
5. Rode o servidor em desenvolvimento ou produção.

### Configuração Inicial

```bash
# Instalar dependências
npm install

# Executar migração (se necessário)
node scripts/migrate_auth.js

# Criar administrador
node scripts/create_admin.js admin@example.com senhaSegura123 "Nome do Admin"
```

### Desenvolvimento
- Para rodar o servidor em desenvolvimento, use o comando `npm run dev`.
- O servidor irá reiniciar automaticamente ao detectar mudanças no código.

### Produção
- Para rodar o servidor em produção, use o comando `npm start`.
- Certifique-se de que todas as variáveis de ambiente estão corretamente configuradas no arquivo `.env`.

## 🔐 Autenticação

O sistema utiliza **autenticação JWT** com diferenciação de roles:

- **Admin**: Acesso completo ao dashboard administrativo
- **User**: Usuários do captive portal (autenticação social)

### Endpoints de Autenticação

- `POST /api/auth/login` - Login com email e senha
- `POST /api/auth/register` - Registro de novo admin (requer `ADMIN_REGISTRATION_SECRET`)
- `GET /api/auth/me` - Informações do usuário logado
- `POST /api/auth/logout` - Logout

### Dashboard Admin

Acesse `/admin/login.html` e faça login com as credenciais criadas via script `create_admin.js`.

Tokens JWT têm validade de **8 horas**.

## Scripts úteis
- `npm run dev` - desenvolvimento com nodemon
- `npm start` - inicia servidor
- `node scripts/create_admin.js <email> <password> <name>` - cria administrador
- `node scripts/migrate_auth.js` - migração para adicionar campos de autenticação

## Estrutura
- `src/` backend Express + SQLite
- `public/` frontend simples
- `scripts/` shell para gateway
- `agent/` agente Node.js