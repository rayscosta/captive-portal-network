# 🔒 OAuth em Desenvolvimento - Guia de Configuração com Túnel Público

## ❌ Por que `localhost` não funciona?

O fluxo OAuth funciona assim:
1. **Seu navegador** → Redireciona para Google/Facebook
2. **Google/Facebook** → Usuário faz login
3. **Google/Facebook** → Redireciona de volta para sua aplicação com um `code`
4. **Seu servidor** → Troca o `code` por um `access_token` usando `CLIENT_SECRET`

O problema é que **o Google precisa redirecionar o navegador do usuário para uma URL válida**. 

Para desenvolvimento, `http://localhost` funciona **APENAS** se você registrar exatamente essa URL no Google Cloud Console, MAS:
- O Google pode restringir `localhost` em algumas configurações
- Se você estiver testando de dispositivos móveis, eles não conseguem acessar `localhost` da sua máquina

## ✅ Solução: Túnel Público

Use um serviço de túnel para expor seu servidor local com uma URL pública temporária.

---

## 🚀 Opção 1: ngrok (Recomendado)

### Instalação:

```bash
# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# macOS
brew install ngrok/ngrok/ngrok

# Ou baixe diretamente
# https://ngrok.com/download
```

### Configuração:

1. **Crie conta grátis em:** https://dashboard.ngrok.com/signup

2. **Obtenha seu token:**
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

3. **Inicie o túnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copie a URL pública** (exemplo: `https://abc123.ngrok.io`)

5. **Atualize o Google Cloud Console:**
   - Vá em: https://console.cloud.google.com/apis/credentials
   - Edite seu OAuth 2.0 Client ID
   - Em **Authorized redirect URIs**, adicione:
     ```
     https://abc123.ngrok.io/auth/callback/google
     ```
   - Clique em **Save**

6. **Atualize o `.env`:**
   ```bash
   GOOGLE_CALLBACK_URL=https://abc123.ngrok.io/auth/callback/google
   ```

7. **Acesse via URL pública:**
   ```
   https://abc123.ngrok.io
   ```

---

## 🚀 Opção 2: localtunnel (Mais Simples)

### Instalação:

```bash
npm install -g localtunnel
```

### Uso:

```bash
# Inicia o túnel
lt --port 3000

# Ou com subdomínio customizado (pode já estar em uso)
lt --port 3000 --subdomain mycaptiveportal
```

Você receberá uma URL como: `https://random-name-123.loca.lt`

**⚠️ Aviso:** Na primeira vez que acessar, você verá uma página de aviso. Clique em "Click to Continue".

### Configuração:

1. **Copie a URL fornecida**

2. **Atualize Google Cloud Console** com:
   ```
   https://random-name-123.loca.lt/auth/callback/google
   ```

3. **Atualize `.env`:**
   ```bash
   GOOGLE_CALLBACK_URL=https://random-name-123.loca.lt/auth/callback/google
   ```

---

## 🚀 Opção 3: Cloudflare Tunnel (Permanente)

### Instalação:

```bash
# Ubuntu/Debian
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# macOS
brew install cloudflare/cloudflare/cloudflared
```

### Uso Rápido:

```bash
cloudflared tunnel --url http://localhost:3000
```

Você receberá uma URL como: `https://random-words.trycloudflare.com`

### Uso com Domínio Próprio (Avançado):

1. Autentique:
   ```bash
   cloudflared tunnel login
   ```

2. Crie um túnel:
   ```bash
   cloudflared tunnel create captive-portal
   ```

3. Configure DNS e execute

---

## 🔧 Script Automatizado

Criamos um script que tenta usar ngrok, localtunnel ou cloudflared automaticamente:

```bash
# Execute em um terminal separado
./scripts/dev-tunnel.sh
```

**Em outro terminal, inicie o servidor:**
```bash
npm run dev
```

---

## 📋 Checklist de Configuração

- [ ] Túnel público rodando e URL obtida
- [ ] Google Cloud Console atualizado com nova redirect URI
- [ ] `.env` atualizado com `GOOGLE_CALLBACK_URL`
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Acessar via URL pública (não `localhost`)

---

## 🎯 Para Facebook OAuth

O processo é idêntico:

1. **Obtenha URL pública do túnel**

2. **Configure no Facebook Developers:**
   - Vá em: https://developers.facebook.com/apps/
   - Selecione seu app
   - **Facebook Login** → **Settings**
   - Em **Valid OAuth Redirect URIs**, adicione:
     ```
     https://sua-url-publica.ngrok.io/auth/callback/facebook
     ```

3. **Atualize `.env`:**
   ```bash
   FACEBOOK_CALLBACK_URL=https://sua-url-publica.ngrok.io/auth/callback/facebook
   ```

---

## ⚠️ Importante para Produção

### URLs de Desenvolvimento vs Produção

Seu `.env` de desenvolvimento:
```bash
GOOGLE_CALLBACK_URL=https://abc123.ngrok.io/auth/callback/google
```

Seu `.env` de produção (quando deployar):
```bash
GOOGLE_CALLBACK_URL=https://captive.seudominio.com/auth/callback/google
```

### Registre AMBAS no Google Cloud Console

Você pode registrar múltiplas redirect URIs:
```
http://localhost:3000/auth/callback/google         # Dev local (limitado)
https://abc123.ngrok.io/auth/callback/google       # Dev com túnel
https://captive.seudominio.com/auth/callback/google # Produção
```

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** A URL no `.env` não corresponde exatamente à registrada no Google.

**Solução:**
1. Verifique que copiou a URL completa do túnel
2. Certifique-se de incluir `https://` e o caminho completo `/auth/callback/google`
3. Aguarde alguns minutos após salvar no Google Console (pode demorar para propagar)

### Erro: "Failed to exchange code for token"

**Causa:** Problema na troca do código por token.

**Solução:**
1. Verifique se `GOOGLE_CLIENT_SECRET` está correto no `.env`
2. Certifique-se de que está usando HTTPS no túnel
3. Verifique os logs do servidor para detalhes

### Túnel ngrok fecha sozinho

**Causa:** Plano gratuito tem limitações de tempo.

**Solução:**
- Use `localtunnel` como alternativa
- Ou assine o plano pago do ngrok para túneis persistentes

---

## 📚 Recursos

- [ngrok Documentation](https://ngrok.com/docs)
- [localtunnel GitHub](https://github.com/localtunnel/localtunnel)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
