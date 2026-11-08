# Ututena — Motion Design 1.2 (Novembro de 2026)

## Objectivo

Actualizar a landing page aprovada v1.1 com um sistema de movimento que torne o produto mais perceptível **sem adiar o hero, remover CTAs ou introduzir dependências pesadas**. O projecto preserva HTML/CSS/JS nativos, Cloudflare Pages Functions e todos os contactos oficiais.

## Padrões implementados

| Local | Comportamento | Intenção |
| --- | --- | --- |
| Hero | Sublinhado editorial de entrada, módulos e chip com flutuação suave, traçado SVG progressivo | Estabelecer identidade e comunicar progressão |
| Dashboard hero | Destaque sequencial nos três atributos + barras que entram de forma progressiva | Demonstrar passagem de criação → prática → evolução |
| Secção IA | Núcleo geométrico com respiração e órbitas discretas | Humanizar uma capacidade técnica |
| Percurso interactivo (NOVO) | Três estados seleccionáveis: Conteúdo → Mentor IA → Competências; animação cíclica opcional | Explicar o produto através do próprio movimento |
| Demo e cards | Transições entre estados, feedback hover e entrada de blocos fora do primeiro ecrã | Guiar atenção e manter contexto |
| Navegação | Barra fina de progresso da leitura | Orientação, sem interromper leitura |

## Escolha tecnológica

- CSS/SVG e JavaScript nativo; **não usar Three.js, GSAP, Framer Motion, WebGL nem dependências de terceiros nesta fase**.
- Animar preferencialmente `transform` e `opacity`. A barra de navegação usa `transform: scaleX()`, não largura.
- A primeira dobra continua legível imediatamente: título e CTA não dependem da conclusão de uma animação.
- O percurso alterna automaticamente a cada ~6s **apenas quando visível**, página activa e preferência normal de movimento.
- O utilizador pode tocar nos três passos; ao seleccionar manualmente, a reprodução pausa para respeitar a sua leitura.
- O botão Pausar/Reproduzir controla a sequência e os movimentos ambientes. Em `prefers-reduced-motion` ou Data Saver, o estado estático é o padrão, com controlos de selecção ainda funcionais.

## Conteúdos comerciais

- Os três passos são **demonstrações conceptuais** e não incluem métricas reais.
- A integração com a base Mentingo mantém dependências e funcionalidades sujeitas à validação do projecto específico.
- Não foram adicionados logótipos de terceiros nem números de resultados sem base real.
- Os CTAs mantêm a acção principal de agendamento de demonstração.

## QA realizado

- `node --check public/app.js`: passou.
- `node --test tests/*.test.mjs`: nove testes do endpoint de leads passaram.
- Análise sintáctica do HTML/CSS e presença de IDs únicos.
- Browser em 1440 × 900, 768 × 1024 e 390 × 844: verificadas navegação pelos três passos, pausa/reprodução, formulário existente, ausência de overflow horizontal e ausência de erros de JavaScript.
- Preferência `prefers-reduced-motion: reduce`: conteúdo acessível e os três passos utilizáveis.
- A pré-visualização HTML offline inclui os assets locais e utiliza fontes de fallback quando o browser não tem acesso às webfonts. Em produção, mantêm-se as fontes previamente utilizadas.

## Verificações após publicação na Cloudflare

1. Confirmar Google Fonts e CSP no domínio real.
2. Medir Lighthouse (mobile), LCP (objectivo <= 2,5s), INP (<= 200ms) e CLS (<= 0,1) com rede simulada e Field Data; resultados **não foram medidos em produção**.
3. Verificar acessibilidade com VoiceOver / TalkBack e `prefers-reduced-motion` em browsers reais.
4. Confirmar configuração Turnstile, Resend e envio de lead real para `info@ututena.com`.
5. Comparar conversão da versão 1.1 e da 1.2; motion não é garantia de aumento de leads.

## Referências de produto e implementação

- https://360learning.com/
- https://www.docebo.com/
- https://www.learnupon.com/
- https://linear.app/
- https://resend.com/
- https://web.dev/articles/top-cwv
- https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
