# 🚀 Guia Rápido - OAuth com Túnel Público

## ⚡ Início Rápido (3 passos)

### 1️⃣ Instale o ngrok

```bash
# Opção 1: Snap (Ubuntu/Linux)
sudo snap install ngrok

# Opção 2: Download direto
# https://ngrok.com/download
```

### 2️⃣ Inicie o túnel e o servidor

**Terminal 1 - Túnel:**
```bash
ngrok http 3000
```

Você verá algo assim:
```
Forwarding    https://abc-123-def.ngrok-free.app -> http://localhost:3000
```

**Copie a URL HTTPS** (exemplo: `https://abc-123-def.ngrok-free.app`)

**Terminal 2 - Servidor:**
```bash
npm run dev
```

### 3️⃣ Configure o Google OAuth

1. **Google Cloud Console:** https://console.cloud.google.com/apis/credentials

2. **Edite seu OAuth Client ID**

3. **Adicione em "Authorized redirect URIs":**
   ```
   https://abc-123-def.ngrok-free.app/auth/callback/google
   ```
   (substitua pela sua URL do ngrok)

4. **Salve**

5. **Atualize o `.env`:**
   ```bash
   GOOGLE_CALLBACK_URL=https://abc-123-def.ngrok-free.app/auth/callback/google
   ```

6. **Reinicie o servidor** (Ctrl+C e `npm run dev` novamente)

7. **Acesse via ngrok:**
   ```
   https://abc-123-def.ngrok-free.app
   ```

8. **Teste o login Google!** 🎉

---

## 🔍 Verificando Erros

### No servidor, você verá:
```
🚀 Server running on http://localhost:3000
📚 API Docs: http://localhost:3000/api-docs

📋 OAuth Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 Google OAuth: ✅ Configured
   Client ID: 177204529008-er5l2jq...
   Callback: https://abc-123-def.ngrok-free.app/auth/callback/google

🔷 Facebook OAuth: ❌ Missing credentials

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Erros comuns:

**"Authentication failed"**
- Verifique se a URL no `.env` corresponde EXATAMENTE à URL do ngrok
- Certifique-se de ter salvo no Google Cloud Console
- Aguarde 1-2 minutos para propagar

**"redirect_uri_mismatch"**
- A URL registrada no Google é diferente da URL no `.env`
- Copie novamente a URL do ngrok e atualize AMBOS

---

## 💡 Dicas

### ngrok sempre muda a URL?
Sim, no plano gratuito. Toda vez que reiniciar, terá uma nova URL.

**Soluções:**
1. **Use subdomínio fixo (ngrok pago):**
   ```bash
   ngrok http 3000 --domain=mycaptiveportal.ngrok.io
   ```

2. **Registre múltiplas URLs no Google:**
   - Adicione 3-4 URLs do ngrok de uma vez
   - Quando o ngrok mudar, use uma das outras registradas

3. **Use localtunnel com subdomínio:**
   ```bash
   lt --port 3000 --subdomain mycaptiveportal
   ```

### Como sei qual URL usar?
Sempre use a URL **HTTPS** que o ngrok mostra na linha "Forwarding".

### Posso usar localhost?
Apenas se registrar `http://localhost:3000/auth/callback/google` no Google Console.
MAS isso só funciona no seu computador - não em dispositivos móveis.

---

## 📱 Testando em Mobile

1. Conecte seu celular na mesma rede Wi-Fi

2. Acesse a URL do ngrok no celular:
   ```
   https://abc-123-def.ngrok-free.app
   ```

3. O OAuth funcionará perfeitamente! 🎉

---

## 🎯 Checklist Final

- [ ] ngrok instalado e rodando
- [ ] URL HTTPS copiada do ngrok
- [ ] URL adicionada no Google Cloud Console (Authorized redirect URIs)
- [ ] `.env` atualizado com `GOOGLE_CALLBACK_URL`
- [ ] Servidor reiniciado
- [ ] Acessando via URL do ngrok (não localhost)
- [ ] Login Google funciona! ✅

---

## 📞 Precisa de Ajuda?

Veja a documentação completa em:
- `docs/oauth-setup.md` - Como obter credenciais OAuth
- `docs/oauth-tunnel-setup.md` - Guia completo de túneis públicos

Ou execute o script automatizado:
```bash
./scripts/dev-tunnel.sh
```
