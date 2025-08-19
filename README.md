# captive-portal-network

Sistema acadêmico de gerenciamento de ativos de TI e captive portal com autenticação social.

## Como rodar

1. Copie `.env.example` para `.env` e ajuste valores.
2. Instale as dependências com npm.
3. Rode o servidor em desenvolvimento ou produção.

### Desenvolvimento
- Para rodar o servidor em desenvolvimento, use o comando `npm run dev`.
- O servidor irá reiniciar automaticamente ao detectar mudanças no código.

### Produção
- Para rodar o servidor em produção, use o comando `npm start`.
- Certifique-se de que todas as variáveis de ambiente estão corretamente configuradas no arquivo `.env`.

## Scripts úteis
- `npm run dev` - desenvolvimento com nodemon
- `npm start` - inicia servidor

## Estrutura
- `src/` backend Express + SQLite
- `public/` frontend simples
- `scripts/` shell para gateway
- `agent/` agente Node.js