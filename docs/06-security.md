# Segurança e Regras

- Basic Auth para endpoints administrativos
- Somente comandos predefinidos (sem entrada livre)
- OAuth state vinculado a IP/MAC para mitigar CSRF
- Sessões de captive portal com TTL configurável
- PRAGMA foreign_keys=ON no SQLite
- Próximos passos: rate limiting, validação de payload, auditoria via AuditLog
