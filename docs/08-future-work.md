# 8. Trabalhos Futuros e Melhorias

Esta seção descreve potenciais melhorias e novas funcionalidades que podem ser implementadas para evoluir o sistema.

## 8.1. Funcionalidades

-   **Dashboard de Métricas Avançado**:
    -   Criar um dashboard mais rico na interface de administração, com gráficos sobre o número de acessos, tempo médio de conexão, provedores de login mais usados (Google vs. Facebook) e tipos de dispositivos.
    -   Adicionar filtros por período (dia, semana, mês).

-   **Controle de Banda por Usuário**:
    -   Integrar com `tc` (Traffic Control) no gateway Linux para permitir a limitação da velocidade de download/upload por sessão de usuário, criando diferentes "planos" de acesso.

-   **Página de Sucesso Customizável**:
    -   Permitir que o administrador configure a URL de redirecionamento pós-login através do painel, em vez de ser um valor fixo no `.env`.

-   **Suporte a Múltiplos Idiomas**:
    -   Internacionalizar a página do captive portal e a interface de administração.

-   **Comandos Personalizados para Agentes**:
    -   Criar uma interface no painel de administração onde o administrador possa cadastrar novos comandos shell seguros, que seriam então distribuídos para a "whitelist" dos agentes.

## 8.2. Melhorias Técnicas

-   **Testes Automatizados**:
    -   Implementar uma suíte de testes unitários (com Jest) para as camadas de `Service` e `Repository`.
    -   Adicionar testes de integração para os `Controllers` e os principais fluxos da API.
    -   Configurar um pipeline de Integração Contínua (CI) no GitHub Actions para rodar os testes a cada push.

-   **Refatoração para TypeScript**:
    -   Migrar a base de código de JavaScript para TypeScript para adicionar tipagem estática, melhorando a manutenibilidade e reduzindo bugs em tempo de desenvolvimento.

-   **Gerenciamento de Segredos**:
    -   Integrar com um cofre de segredos (como HashiCorp Vault ou Azure Key Vault) para gerenciar as credenciais de banco de dados, segredos de OAuth e chaves de JWT, em vez de usar arquivos `.env` em produção.

-   **Alta Disponibilidade (HA)**:
    -   **Servidor**: Configurar a aplicação para rodar em múltiplos nós com um load balancer. Isso requereria mover o banco de dados SQLite para uma solução de banco de dados centralizada (como PostgreSQL ou MySQL) e usar um armazenamento compartilhado (como Redis) para sessões.
    -   **Gateway**: Implementar um setup de gateway redundante usando protocolos como VRRP (Virtual Router Redundancy Protocol) para garantir que a rede não pare se o gateway principal falhar.

-   **Logs Estruturados**:
    -   Adotar uma biblioteca de log como `pino` ou `winston` para gerar logs em formato JSON, facilitando a ingestão e análise por sistemas de monitoramento (ex: ELK Stack, Datadog).

## 8.3. Segurança

-   **Autenticação de Dois Fatores (2FA)**:
    -   Adicionar suporte a 2FA (via TOTP, como Google Authenticator) para o login de administradores.

-   **Análise de Vulnerabilidades**:
    -   Integrar ferramentas de análise estática de segurança (SAST) e análise de dependências (como `npm audit` ou Snyk) no pipeline de CI para detectar vulnerabilidades automaticamente.

-   **Política de Senha Forte**:
    -   Implementar uma política de senha mais rigorosa para os administradores, forçando complexidade e rotação periódica.
