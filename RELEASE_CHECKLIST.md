# Publicar em Cloudflare Pages — checklist

1. Criar repo privado apenas para a landing, com `public/`, `functions/`, `package.json` e `README.md` na raiz.
2. Cloudflare Dashboard → Workers & Pages → Pages → Connect to Git.
3. Preset **None**, build command vazio, output directory **public**.
4. Conectar `ututena.com` e configurar `www` (redirecionamento canónico). O domínio já foi adquirido; **o deploy não foi realizado aqui**.
5. Confirmar e-mail `info@ututena.com` operacional para receber leads.
6. Validar o domínio remetente no Resend; configurar `UTUTENA_FROM_EMAIL="Ututena <info@ututena.com>"`, `UTUTENA_TO_EMAIL=info@ututena.com`, `RESEND_API_KEY` como secret.
7. Criar widget Turnstile para `ututena.com`; colocar a site key pública em `public/config.js` e `TURNSTILE_SECRET_KEY` como secret.
8. Ajustar `TURNSTILE_ALLOWED_HOSTNAMES` para os domínios reais.
9. Publicar, fazer uma submissão de teste real e verificar o e-mail na caixa info@ututena.com.
10. Abrir links WhatsApp, Messenger e Facebook no domínio publicado e confirmar perfis.
11. Aprovar privacidade, cookies, tratamento de IA e quaisquer licenças/registos legais aplicáveis.
12. Validar no fork/deploy Ututena as capacidades de IA anunciadas; substituir maquetes por capturas reais após aprovação.
