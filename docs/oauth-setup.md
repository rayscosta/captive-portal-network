# 🔐 Guia de Configuração OAuth

Este guia explica como obter as credenciais OAuth necessárias para o Captive Portal Network.

## 📋 Pré-requisitos

- Conta Google (para Google OAuth)
- Conta Facebook Developer (para Facebook OAuth)
- Acesso às URLs de callback em desenvolvimento ou produção

## 🔵 Google OAuth Setup

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Dê um nome ao projeto (ex: "Captive Portal Network")
4. Clique em **"Create"**

### 2. Habilitar Google+ API

1. No menu lateral, vá em **"APIs & Services"** → **"Library"**
2. Busque por **"Google+ API"** ou **"Google People API"**
3. Clique em **"Enable"**

### 3. Criar Credenciais OAuth

1. Vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. Configure a tela de consentimento (OAuth consent screen) se solicitado:
   - User Type: **External**
   - App name: **Captive Portal Network**
   - User support email: seu email
   - Developer contact: seu email
   - Adicione escopos: `email`, `profile`, `openid`
4. Volte para **"Credentials"** e crie o OAuth client ID:
   - Application type: **Web application**
   - Name: **Captive Portal Web Client**
   
5. Adicione **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback/google
   http://192.168.10.1:3000/auth/callback/google
   https://seu-dominio.com/auth/callback/google
   ```

6. Clique em **"Create"**
7. Copie o **Client ID** e **Client Secret**

### 4. Configurar .env

```bash
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback/google
```

---

## 🔷 Facebook OAuth Setup

### 1. Criar App no Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"My Apps"** → **"Create App"**
3. Escolha o tipo: **Consumer** (ou **None** se disponível)
4. Preencha:
   - App Name: **Captive Portal Network**
   - App Contact Email: seu email
5. Clique em **"Create App"**

### 2. Adicionar Facebook Login

1. No dashboard do app, procure **"Facebook Login"**
2. Clique em **"Set Up"**
3. Escolha plataforma: **Web**
4. Pule o quickstart e vá para **Settings** → **Basic**

### 3. Configurar OAuth Redirect URIs

1. No menu lateral, clique em **"Facebook Login"** → **"Settings"**
2. Em **"Valid OAuth Redirect URIs"**, adicione:
   ```
   http://localhost:3000/auth/callback/facebook
   http://192.168.10.1:3000/auth/callback/facebook
   https://seu-dominio.com/auth/callback/facebook
   ```
3. Clique em **"Save Changes"**

### 4. Obter Credenciais

1. Vá em **"Settings"** → **"Basic"**
2. Copie o **App ID**
3. Clique em **"Show"** no **App Secret** e copie

### 5. Configurar .env

```bash
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/callback/facebook
```

### 6. Ativar o App (Produção)

Para uso em produção, você precisa:
1. Completar a **App Review**
2. Adicionar **Privacy Policy URL**
3. Adicionar **Terms of Service URL**
4. Mudar o modo de **Development** para **Live**

---

## ⚙️ Configuração Completa do .env

Após obter todas as credenciais, seu arquivo `.env` deve ficar assim:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database.sqlite

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=seu_password_seguro

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback/google

# Facebook OAuth
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/callback/facebook

# Instagram Redirect
INSTAGRAM_REDIRECT_URL=https://instagram.com/sua_instituicao

# Session Configuration
SESSION_SECRET=generate_random_secret_with_32_chars_or_more
SESSION_TIMEOUT=3600

# Network Configuration
WAN_INTERFACE=eth0
LAN_INTERFACE=eth1
LAN_IP=192.168.10.1
```

---

## 🧪 Testando a Configuração

### 1. Verificar variáveis de ambiente

```bash
# No terminal do projeto
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLIENT_ID ? '✅ Google OK' : '❌ Google Missing')"
node -e "require('dotenv').config(); console.log(process.env.FACEBOOK_APP_ID ? '✅ Facebook OK' : '❌ Facebook Missing')"
```

### 2. Testar fluxo OAuth

1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: `http://localhost:3000`

3. Clique em **"Continuar com Google"** ou **"Continuar com Facebook"**

4. Você será redirecionado para a página de login do provedor

5. Após autenticar, será redirecionado de volta para sua aplicação

6. Verificque os logs do servidor para confirmar:
   ```
   [ALLOW] Access granted for MAC: AA:BB:CC:DD:EE:FF (user@email.com)
   ```

---

## 🔒 Segurança em Produção

### Boas Práticas:

1. **Nunca comite o arquivo `.env`** no Git
   - Já está no `.gitignore`
   - Use `.env.example` como template

2. **Use HTTPS em produção**
   - Configure SSL/TLS no servidor
   - Atualize as callback URLs para HTTPS

3. **Proteja as credenciais**
   - Use secrets managers (AWS Secrets, HashiCorp Vault)
   - Rotacione credenciais periodicamente

4. **Limite os escopos OAuth**
   - Solicite apenas `email` e `profile`
   - Não peça permissões desnecessárias

5. **Configure domínios autorizados**
   - No Google Cloud Console
   - No Facebook App Settings

---

## ❓ Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** A URL de callback não está registrada no provedor

**Solução:**
- Verifique se a URL no `.env` corresponde exatamente à registrada
- URLs devem incluir protocolo (http/https), porta e caminho completo
- Não pode haver barra final `/` extra

### Erro: "invalid_client"

**Causa:** Client ID ou Secret incorretos

**Solução:**
- Copie novamente as credenciais do console
- Certifique-se de que não há espaços extras
- Verifique se o app está no modo correto (dev/production)

### Erro: "access_denied"

**Causa:** Usuário negou permissões ou app não está aprovado

**Solução:**
- Para Google: verifique se o app está em teste e o usuário é testador
- Para Facebook: verifique se o app está em modo development

---

## 📚 Referências

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Specification](https://oauth.net/2/)
