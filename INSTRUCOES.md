# Orientações de Estilo de Código

- Sempre utilize **arrow functions** (`=>`) para definir funções em JavaScript.
- Prefira o uso de **const** ao invés de let sempre que possível.
- Utilize **async/await** para operações assíncronas, evitando callbacks e `.then()`.
- Sempre utilize nomes de variáveis em **inglês**.
- As explicações e comentários de código devem ser feitas em **português**.
- Utilize **Programação Orientada a Objetos (POO)**: estruture o backend em camadas com `Repositories` (acesso a dados), `Services` (regras de negócio) e `Controllers` (camada web), evitando lógica de negócio dentro de rotas.


# Contexto do Projeto: Sistema de Gerenciamento de Ativos e Captive Portal

Este projeto é um sistema acadêmico de gerenciamento remoto de ativos de TI e um captive portal com autenticação social. A comunicação entre o backend e os agentes nos ativos é central.

---
## Stack Técnica

- **Backend:** Node.js com Express
- **Banco de Dados:** SQLite (arquivo `database.sqlite`)
- **Frontend:** HTML/JS puro (leve)
- **Agente:** Node.js (executável de console) em máquinas/VMs
- **Autenticação:** Server-side OAuth para Google e Facebook
- **Scripts:** Shell (`.sh`) para manipular o firewall/gateway

---
## Requisitos e Funcionalidades Principais

1. **Gestão de Ativos:**
   - CRUD de ativos (name, type, IP, MAC, agentToken)
   - Visualização de detalhes e histórico por ativo

2. **Envio de Comandos:**
   - Envio de comandos pré-definidos (`UNAME`, `DF`, `UPTIME`, `LSROOT`)
   - Agente faz `poll` na API para buscar e executar comandos pendentes
   - O resultado do comando é enviado e armazenado

3. **Captive Portal:**
   - Redirecionamento para a página de login com Google/Facebook
   - Após o login, cria uma `CaptiveSession`, executa um script shell para liberar o acesso à internet e redireciona para o Instagram

4. **Agente (Node.js):**
   - Faz `heartbeat` periódico
   - Executa apenas comandos permitidos pelo servidor
   - Envia o resultado da execução de volta à API

5. **Segurança e Regras de Negócio:**
   - **Autenticação:** `basic auth` ou token na UI de admin
   - **OAuth State:** O `state` deve ser vinculado ao MAC e IP para prevenção de CSRF
   - **Comandos:** Somente comandos predefinidos. Sem texto livre
   - **Sessões de Acesso:** Temporárias, com duração configurável
   - **Logs:** Auditoria de comandos e sessões (quem, o quê, quando)

---
## Estrutura de Dados (Entidades)

- **`User`**
- **`CaptiveSession`**
- **`Asset`**
- **`Command`**
- **`CommandResult`**
- **`StateChallenge`**

---
## Instruções de Uso

1. **Instale as dependências**
   
   Execute o comando abaixo no terminal para instalar todas as dependências necessárias:
   ```sh
   npm install
   ```

2. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto e adicione as variáveis necessárias conforme especificado na documentação ou no arquivo `.env.example` (se existir).

3. **Execute o projeto**
   
   Para iniciar a aplicação, utilize o comando:
   ```sh
   npm start
   ```
   ou, se houver um script específico, consulte o `package.json` para mais detalhes.

4. **Testes**
   
   Para rodar os testes automatizados, utilize:
   ```sh
   npm test
   ```
   ou
   ```sh
   npx jest
   ```
   (dependendo do framework de testes utilizado).

5. **Scripts úteis**
   
   Consulte o arquivo `package.json` para outros scripts disponíveis, como:
   - `npm run dev` para ambiente de desenvolvimento
   - `npm run lint` para análise de código

6. **Scripts Shell**
   
   Os scripts shell para manipulação do firewall/gateway devem estar no diretório `/scripts`.

7. **Contribuição**
   
   Sinta-se à vontade para abrir issues ou pull requests para contribuir com melhorias.

Se precisar de ajuda, consulte a documentação ou entre em contato com o mantenedor do projeto.

---
## Observações para Desenvolvimento

- O código deve ser modular e seguir as melhores práticas para Node.js (separação de responsabilidades).
- Prefira o uso de variáveis de ambiente para segredos (`process.env`).
- As funcionalidades devem ser desenvolvidas sequencialmente, priorizando as APIs de Gestão de Ativos e o Agente, seguidas pelo Captive Portal.