# Guia de Documentação Swagger

## 📚 Acessando a Documentação

A documentação interativa da API está disponível em:

```
http://localhost:3000/api-docs
```

## 🎯 O que é o Swagger?

O Swagger UI fornece uma interface interativa para:
- Visualizar todos os endpoints da API
- Testar requisições diretamente no navegador
- Ver exemplos de request/response
- Entender os schemas de dados
- Explorar autenticação e autorização

## 📝 Como Documentar Novos Endpoints

Para adicionar documentação a um endpoint, use anotações JSDoc:

```javascript
/**
 * @swagger
 * /api/seu-endpoint:
 *   get:
 *     summary: Descrição curta do endpoint
 *     tags: [NomeDaTag]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Descrição do parâmetro
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campo:
 *                   type: string
 *                   example: valor
 */
router.get('/seu-endpoint', controller.method)
```

## 🏷️ Tags Disponíveis

- **Assets** - Gerenciamento de ativos de TI
- **Commands** - Execução de comandos remotos
- **Agent** - Comunicação com agentes
- **Captive Portal** - Autenticação e sessões
- **Health** - Status da aplicação

## 🔒 Schemas de Segurança

### BearerAuth
Usado para endpoints administrativos:
```
Authorization: Bearer <seu-token-jwt>
```

### AgentToken
Usado para comunicação do agente:
```
X-Agent-Token: <token-do-agente>
```

## 📦 Schemas Reutilizáveis

Os schemas estão definidos em `src/config/swagger.js`:

- **Asset** - Estrutura de um ativo de TI
- **Command** - Estrutura de comando remoto
- **Error** - Estrutura de erro padrão

## 🚀 Exemplos de Uso

### 1. Testar Endpoint na Interface

1. Acesse http://localhost:3000/api-docs
2. Clique no endpoint desejado
3. Clique em "Try it out"
4. Preencha os parâmetros necessários
5. Clique em "Execute"

### 2. Exportar Documentação

A especificação OpenAPI está disponível em:
```
http://localhost:3000/api-docs/swagger.json
```

### 3. Gerar Client SDKs

Use ferramentas como `swagger-codegen` para gerar clients:
```bash
swagger-codegen generate -i http://localhost:3000/api-docs/swagger.json -l javascript -o ./client
```

## 📋 Checklist de Documentação

Ao criar um novo endpoint, certifique-se de:

- [ ] Adicionar anotação @swagger
- [ ] Definir summary claro
- [ ] Adicionar tag apropriada
- [ ] Documentar todos os parâmetros
- [ ] Documentar todos os códigos de resposta
- [ ] Incluir exemplos realistas
- [ ] Especificar schema de segurança se necessário
- [ ] Testar na interface Swagger UI

## 🔧 Configuração

A configuração do Swagger está em:
```
src/config/swagger.js
```

Para modificar:
- Informações da API (título, descrição, versão)
- Servidores disponíveis
- Tags e categorias
- Schemas reutilizáveis
- Configurações de segurança

## 📖 Recursos

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
