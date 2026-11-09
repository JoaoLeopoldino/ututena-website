# Ututena — Landing Page v1.1 para Cloudflare Pages (IA & Mentingo)

**Marca:** Ututena — by Utu Lab. **Assinatura:** Aprender para ser capaz.

Página estática, sem framework/bundler, com UI interactiva e endpoint serverless `POST /api/leads` via Cloudflare Pages Functions. A experiência visual da plataforma é **conceptual**, não um screenshot do produto real.

## Incluído

- Hero editorial com CTA de demonstração, mensagem de IA nos primeiros segundos e imagem da identidade Ututena
- Secções problema → plataforma → IA (mentor, criação de cursos, avaliação) → funcionalidades enterprise → casos de uso → método → FAQ → contacto
- Demonstração visual interactiva com quatro perspectivas (IA, formação, competências, evidências) (dados fictícios)
- Formulário com validação de campos, consentimento, honeypot e integração Turnstile
- Envio de lead via Resend a uma caixa de entrada (sem criar CRM nem guardar base de dados)
- Responsividade mobile, navegação por teclado, `prefers-reduced-motion`
- SEO, Open Graph, JSON-LD, sitemap, robots, headers de segurança, política inicial de privacidade
- Tracking de UTM sem carregar ferramentas externas de analytics (captura no e-mail)

## Publicação recomendada — Cloudflare Pages via Git

1. Criar um **repositório privado específico para a landing page**. Não inserir este código dentro do fork do Mentingo; o software LMS e o site comercial têm ciclos independentes.
2. Fazer push **do conteúdo desta pasta** para o repositório; o nível superior deve conter `/public` e `/functions`.
3. No Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git, escolher o repositório.
4. Framework preset: **None**. Build command: **em branco**. Build output directory: **`public`**. Root directory: `/`.
5. Associar o domínio já registado na Cloudflare: `ututena.com`, com redireccionamento `www → raiz` se desejado.
6. No [Resend](https://resend.com), verificar domínio emissor e criar API key. O e-mail `info@ututena.com` é apenas uma sugestão: é preciso autorizar o domínio e o remetente escolhido.
7. No Cloudflare Dashboard → Turnstile, criar um widget para `ututena.com` e obter a **site key** e **secret key**.
8. Em `public/config.js`, colocar a `turnstileSiteKey` **pública** (não a secret). Exemplo: `turnstileSiteKey: '0x4AAAA...'`.
9. Em Pages → Settings → Variables and Secrets, configurar **segredos** (produção e previews relevantes):
   - `RESEND_API_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `UTUTENA_FROM_EMAIL` (por exemplo `Ututena <info@ututena.com>`)
   - `UTUTENA_TO_EMAIL` (por exemplo `info@ututena.com`)
   - `TURNSTILE_ALLOWED_HOSTNAMES` (opcional, por exemplo `ututena.com,www.ututena.com`; adaptar aos previews para testes).
10. Publicar novamente depois de adicionar variáveis. Testar um pedido real, resposta por e-mail, Turnstile e preview mobile. **Não publicar o formulário como funcional sem configurar os segredos.**
11. Aprovar o conteúdo de `public/privacidade.html` com a prática real e as obrigações jurídicas da Utu Lab.

> Atenção: a função **não é suportada se fizer apenas drag-and-drop da pasta `public` no dashboard**. Usar integração Git ou `wrangler pages deploy public` executado na raiz deste projecto, onde `/functions` existe.

## Publicação alternativa — Wrangler CLI

```bash
npm install
npx wrangler login
npx wrangler pages project create ututena-website --production-branch main
npm run deploy
```

Definir os segredos através do Dashboard ou CLI (`npx wrangler pages secret put RESEND_API_KEY --project-name ututena-website`, repetindo para os restantes), antes de activar os envios.

## Desenvolvimento e testes

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
npm test
```

`public/config.js` contém inicialmente uma site key vazia, para impedir desafios não configurados. Até configurar Turnstile e Resend, o endpoint devolve HTTP 503 e **não finge que a lead foi enviada**. O CTA alternativo `info@ututena.com` continua a funcionar.

## Métricas para medir (não são resultados garantidos)

- Cliques no CTA principal (hero)
- Interacções com a secção de demonstração
- Inícios de preenchimento do formulário
- Submissões válidas e taxas de erro
- Leads qualificadas por sector, colaborador e dor
- Reuniões realizadas por origem UTM

Uma futura ferramenta de analytics deve respeitar as preferências e obrigações de privacidade e não deve ser instalada apenas como decoração.

## Segurança e privacidade

- Segredos apenas em Cloudflare Pages Functions, nunca no navegador.
- Turnstile com validação **server-side** e verificação da acção do widget.
- CORS same-origin para submissões de formulário, verificação dos campos, limite de tamanho e honeypot.
- A API encaminha dados por e-mail Resend; não os persiste em BD nem fornece consentimento para campanhas.
- Informações legais e eventual regime de protecção de dados devem ser revistos antes da publicação.

## Ajustes antes de lançar

- O domínio `ututena.com` já está registado na Cloudflare; ligar a zona ao projecto Pages e validar a configuração DNS (não efectuado neste kit).
- Confirmar os links institucionais, oferta comercial, prazo de resposta e objectivos do diagnóstico.
- Testar LCP/CLS no domínio publicado, acessibilidade com leitor de ecrã e webfont fallback.
- Validar se será oferecido um serviço de diagnóstico gratuito ou pago; esta versão **não promete gratuidade**.
- Depois de existir uma demonstração real do produto, substituir a visualização conceptual por UI verificada.

## Referências estudadas

- [360Learning](https://360learning.com/) — ligação aprendizagem/skills e CTA demo.
- [Docebo](https://www.docebo.com/learning-platform/) — orientação a audiência e prova empresarial.
- [LearnUpon](https://www.learnupon.com/) — comunicação sobre capacidade humana.
- [TalentLMS](https://www.talentlms.com/) — simplicidade e conversão sem fricção.
- [Totara](https://totara.com/learning-management-system-lms/) — flexibilidade enterprise.
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) e [Resend](https://resend.com/features/email-api).

Nenhum testemunho, logótipo de cliente ou métrica demonstrativa dos concorrentes foi transplantado para a Ututena.

## Actualização v1.1 — IA e contactos oficiais

- E-mail: `info@ututena.com`. Telefone: `+244 972 856 085`. WhatsApp: `https://wa.me/244972856085`. Messenger: `https://m.me/ututena`. Facebook: `https://www.facebook.com/ututena`.
- Plataforma baseada em Mentingo (MIT, licenciamento e avisos devem ser preservados no produto distribuído). A arquitectura de IA descrita está documentada no upstream, não foi verificada no fork privado da Ututena nesta entrega.
- O mentor de IA por voz/chat, a criação assistida de cursos e as avaliações dependem de configuração do modelo, API keys, disponibilidade de serviços externos e testes de produção; o website deixa isto explícito.
- A maquete do hero e a conversa do mentor são ilustrações, não sessões reais do software. Substituir por capturas autorizadas da própria instalação assim que possível.
- A alteração do e-mail destinatário é um valor de exemplo; para receber leads é obrigatório configurar `UTUTENA_TO_EMAIL=info@ututena.com` no ambiente Cloudflare. Nunca colocar chaves secretas em `public/config.js`.
- Confirmar que os perfis de Facebook/Messenger e a ligação WhatsApp estão activos e com permissões de atendimento antes de divulgar.
- Sem deploy automático: é necessário ligar o projecto Pages ao domínio, configurar Resend/Turnstile e publicar.

### Referências verificadas (Novembro de 2026)

- https://mentingo.com/en/ — IA, mentor voz/chat, criação de cursos, simulações, experiências LMS.
- https://github.com/Selleo/mentingo — base open source, licenciamento MIT, integrações e arquitectura.
- https://mentingo.com/en/changelog/ — histórico de funcionalidades e evolução.

## Actualização v1.2 — Motion Design

**Entrega incremental sobre a v1.1.** Não foram alterados os textos centrais de vendas, os contactos, a estrutura do formulário nem o endpoint Cloudflare Pages Functions.

- Novo percurso interactivo com estados Conteúdo → Mentor IA → Competências e controlos acessíveis de pausa/reprodução.
- Motion no hero: linha de progresso SVG, destaque sequencial dos cartões, barras de progresso, underline editorial e movimento ambiente discreto.
- Motion em secções: revelações apenas de elementos fora do primeiro ecrã, entrada dos painéis da demonstração, pequenos hovers e animação suave da composição de IA.
- Suporte a `prefers-reduced-motion`, Data Saver, teclado e `visibilitychange`.
- Zero dependências JS novas: CSS/SVG/JavaScript nativo, sem Three.js.
- **Ver `MOTION_DESIGN.md`** para princípios, QA e validação pós-deployment.
