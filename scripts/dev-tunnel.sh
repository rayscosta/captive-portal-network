#!/bin/bash
# Script para expor servidor local via túnel público para testes OAuth

echo "🌐 Iniciando túnel público para desenvolvimento OAuth..."
echo ""
echo "📋 Opções disponíveis:"
echo "  1. ngrok (recomendado - requer instalação)"
echo "  2. localtunnel (npm package)"
echo "  3. cloudflared tunnel (Cloudflare)"
echo ""

# Verifica se ngrok está instalado
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok encontrado!"
    echo ""
    echo "🚀 Iniciando ngrok na porta 3000..."
    echo ""
    echo "📝 IMPORTANTE: Copie a URL HTTPS que aparecerá abaixo"
    echo "   e atualize no Google Cloud Console:"
    echo "   - Authorized redirect URIs: https://SUA-URL.ngrok.io/auth/callback/google"
    echo ""
    echo "   E no arquivo .env:"
    echo "   - GOOGLE_CALLBACK_URL=https://SUA-URL.ngrok.io/auth/callback/google"
    echo ""
    ngrok http 3000
elif command -v lt &> /dev/null; then
    echo "✅ localtunnel encontrado!"
    echo ""
    echo "🚀 Iniciando localtunnel na porta 3000..."
    lt --port 3000
else
    echo "❌ Nenhuma ferramenta de túnel encontrada."
    echo ""
    echo "📦 Instalando localtunnel globalmente..."
    npm install -g localtunnel
    echo ""
    echo "✅ Instalação concluída!"
    echo "🚀 Iniciando localtunnel na porta 3000..."
    echo ""
    echo "📝 IMPORTANTE: Copie a URL HTTPS que aparecer"
    echo "   e atualize no Google Cloud Console e no .env"
    echo ""
    lt --port 3000
fi
