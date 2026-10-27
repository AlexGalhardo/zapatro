# Site oficial (`site/`)

Site estático do jogo (PLAN RC2, D-25 revista em 2026-10-01): **Next.js 16 com `output: 'export'` (SSG) + Tailwind CSS v4**, `package.json` e `bun.lock` próprios. Publicado em <https://truco.lekzera.xyz> (domínio próprio desde 2026-10-15; `zapaco.vercel.app` redireciona para ele).

## Rotas

| Rota | Conteúdo |
|---|---|
| `/` e `/pt/` | Home numa tela só no desktop (header 56 px, hero em `grid md:grid-cols-2`, footer): título ZAPATRO, tagline, pitch, botões JOGAR AGORA (`/play/`) e Jogar a demo (`/demo/`), linha de apoio e badges de loja à esquerda (máx. 36 rem), trailer 16:9 à direita; no celular a ordem é título, tagline, CTA, trailer, pitch, badges |
| `/presskit/` e `/pt/presskit/` | Ficha técnica (lançamento e preço "a definir"), descrição, história, destaques, trailer, as 6 capturas 1920×1080 do idioma da página, logo (PNG e SVG), ícone e cabeçalho, créditos, zip |
| `/privacy/` e `/pt/privacy/` | Política de privacidade ("não coleta dados", exigida pela Play) |
| `/play/` | Jogo completo (`bun run build`), aberto em nova guia pelo botão da home (janela inteira, tela cheia); `noindex` |
| `/demo/` | Demo web (`bun run build:demo`): Campeonato 1, termina depois do primeiro chefe (D-33); `noindex` |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Gerados pelo App Router (`app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`) a partir de `SITE_URL` |

Inglês fica na raiz e português em `/pt` (dois layouts raiz por grupo de rota, `app/(en)` e `app/(pt)/pt`). Textos em `site/src/i18n.ts` (EN e PT-BR juntos); links de loja/Discord/contato em `site/src/links.ts` (`null` = badge "em breve").

## Comandos

```text
bun run site:build                                  # arte de docs/media, jogo completo e demo, zip do presskit e next build → site/out
bun run site:build -- --skip-demo                    # idem sem regerar /play e /demo
bun scripts/site-check.ts                           # ensaio do deploy: serve site/out como a Vercel e confere rotas, noindex, /play e /demo
bun run site:deploy                                 # publica site/out na Vercel (projeto truco-roguelite, sem build remoto)
# beta: todo push na main roda .github/workflows/deploy.yml (site:build + deploy no projeto beta.lekzera.xyz)
cd site && bun run dev                              # desenvolvimento do site
```

Antes de todo `site:deploy`, rode `bun scripts/site-check.ts` (porta 5211, `--port` muda): ele serve `site/out` com uma pasta por rota, como a Vercel, e falha em rota que não responde 200, `noindex` ausente em `/play/` ou `/demo/`, partida rápida que não chega a 12, `/demo/` que não é a demo, erro de console ou HTTP ≥ 400.

Tudo em `site/public` é gerado por `scripts/site-build.ts` (gitignored); `site/public/img` é apagada e refeita a cada build. As imagens do site e do press kit vêm de `docs/media/` (geradas por `bun scripts/store-art.ts`): `presskit-logo.png|svg`, `store-steam-header.png`, `site-og.jpg` e `store-shot-0N-<nome>-<en|pt-BR>.png`. O build não sobe mais o jogo para capturar telas (a antiga flag `--url` saiu). O trailer aparece sozinho quando `trailer/out/trailer-en.mp4` e `trailer-pt.mp4` existem no build (checado em tempo de build, sem requisição a arquivo ausente); legendas entram quando houver `site/public/trailer/trailer-en.vtt` e `trailer-pt.vtt` (copie-as para lá ou para `trailer/out/`, mesmo nome).

**Sem JS de framework nas páginas.** Todo componente do site é Server Component, então as páginas não precisam de React no navegador. Depois do `next build`, o `site-build.ts` tira do HTML de `site/out` (fora `play/`, `demo/` e `_next/`) os `<script>` do Next, o payload RSC inline e os `preload` de script. O CSS vai inline (`experimental.inlineCss` em `site/next.config.ts`). O único script que fica é o `#lang-paths` do `LangMenu`: ele aponta os links de idioma para a mesma página no outro idioma; sem JS, os links levam à home do outro idioma. O build **falha** se algum arquivo de `site/src` ou `site/app` tiver `"use client"`, porque um componente de cliente pararia de funcionar sem o JS do framework. Para pôr interatividade de React no site, tire o passo de limpeza do `site-build.ts` junto com a trava. O poster do trailer sai em 480, 720 e 960 px (`trailer-poster-<lang>[-480|-720].webp`) com `srcset`/`sizes`, e o celular baixa o de 720.

## Identidade visual (Art Bible v2, `game-director-feedback.md` §7)

- Fundo pintado (Art Bible v3): `art-src/gta/background-2.png` em WebP de 640, 1280 e 1920 px (`/img/bg-<largura>.webp`, gerados por `scripts/site-build.ts`; `globals.css` escolhe por breakpoint) sob um véu escuro `rgb(26 17 22 / .62 → .8)` para o texto manter contraste; `#2B2B2B` só como cor de reserva. Leque de três cartas em SVG como marca-d'água atrás do título (só desktop).
- Tokens num lugar só, `site/app/globals.css` (`@theme` + `:root`): cores do jogo (`--color-bg`, `panel`, `panel-dark`, `gold`, `cream`, `text`, `chips`, `mult`, `cta` verde `#47B468` com texto `#1A1A1A`, `felt`), raio 8/6/4 (`rounded-panel|button|seal`), sombra sólida `0 4px 0 #1A1A1A` (`shadow-solid`), foco 3 px dourado com offset 2 px, movimento 150 ms `ease-out` (zerado com `prefers-reduced-motion`). Utilitários `btn`, `btn-cta`, `card`.
- Fonte única Rubik 400/500/700 via `next/font/google` (`display: swap`, self-hosted no build).
- Trailer (`src/components/Trailer.tsx`): `<video controls preload="metadata" playsinline>` com `poster` e `<track kind="subtitles">`; sem o MP4, o quadro 16:9 mostra o poster com o aviso "Trailer coming soon / Trailer em produção" marcado como imagem provisória. Poster por idioma: `/img/trailer-poster-<en|pt-BR>.webp` (960 px, da captura `store-shot-02-count-<idioma>.png`).
- Badges de loja: link real quando `site/src/links.ts` tem URL; com `null`, texto "(coming soon)/(em breve)" sem link.

## Press kit

- Página: capturas em WebP 1280×720 (`/img/press/<nome>-<idioma>.webp`, ~35–55 kB) com `width`/`height` e `alt` descritivo EN/PT (`shot.*` em `site/src/i18n.ts`); cada uma leva ao PNG 1920×1080. Logo em WebP 640 px ligado ao PNG 2048×640, link para o SVG, ícone 1024 e cabeçalho 920×430.
- Zip `/presskit/truco-roguelite-presskit.zip` (~3 MB): `icon-1024.png` e `press/` com `logo.png`, `logo.svg`, `header.png` e as 12 capturas PNG (6 por idioma). Sem key art: a cena de boteco em pixel art saiu do site.
- Números da ficha conferidos em `src/data` (2026-10-25): 8 Campeonatos, 60 Manhas, 10 chefes (9 sorteáveis + Rei do Truco), 10 companheiros, 5 baralhos, 8 Estacas, 7 modificadores, 8 Simpatias, 7 Lances.

## SEO

- `meta()` em `src/components/Shell.tsx`: título por idioma ("Zapatro — A Truco Paulista Roguelite" / "Zapatro — Roguelite de Truco Paulista"; demais páginas "Press kit · Zapatro"), description, `canonical` por idioma, `hreflang` en, pt-BR e `x-default` → en, Open Graph (`website`, `site_name`, imagem 1200×630 com alt) e `twitter:card summary_large_image`.
- `og:image` = `/img/og.jpg`, de `docs/media/site-og.jpg` (ou `.png`); sem ele o build falha.
- JSON-LD na home: `VideoGame` sempre; `VideoObject` só quando o MP4 do trailer existe.
- Ícones: `/favicon.ico` (32 e 48 px; o sharp não grava ICO, então o build escreve o contêiner à mão com os dois PNG dentro), e em `/img/`: `favicon.svg` (cópia de `art-src/app-icon.svg`), `apple-touch-icon.png` 180, `icon-192.png` e `icon-512.png` no manifest, `icon-64.png` de fallback.
- `/play/` e `/demo/` ficam fora da busca: o build injeta `<meta name="robots" content="noindex">` no `index.html` copiado e o `vercel.json` manda `X-Robots-Tag: noindex`.
- `metadataBase`, sitemap e robots leem `SITE_URL` (padrão `https://truco.lekzera.xyz`). Quando o domínio novo existir: `SITE_URL=https://zapatro.com bun run site:build`.

## Cabeçalhos (`site/vercel.json`, ativo)

O `bun run site:deploy` sobe `site/out` com o `vercel.json` (o `.vercelignore` só deixa os dois), e a Vercel aplica `headers` também em deploy estático pré-construído. Em todo caminho: `Strict-Transport-Security: max-age=63072000`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sem câmera, microfone, geolocalização, pagamento e USB. Em `/play/assets/*` e `/demo/assets/*`, só os arquivos com hash do Vite (`.js`, `.css`, `.woff`, `.woff2` no nível de `assets/`) recebem `Cache-Control: public, max-age=31536000, immutable`; `assets/audio` e `assets/gfx` não têm hash e ficam no cache padrão.

## Domínio zapatro.com e redirecionamentos (desligado até o domínio existir)

A configuração pronta está em `site/vercel.redirects.example.json`. Ela **não** está ativa: no `vercel.json` atual ela mandaria `truco.lekzera.xyz` para um domínio que ainda não resolve.

1. **Migração do save antes de tudo.** O save do jogo web fica no `localStorage`, que é por origem: quem joga em `truco.lekzera.xyz/play/` não leva o progresso para `zapatro.com/play/`. Antes de ligar o redirect, publique no `/play/` antigo um aviso com "Exportar save (.json)" e deixe-o no ar por algumas semanas; no domínio novo o jogador usa "Importar save", que já existe em Configurações. Só depois ligue o redirect de `/play/` e `/demo/`.
2. Registrar `zapatro.com` (verificar disponibilidade antes de divulgar).
3. Vercel, projeto `truco.lekzera.xyz` (`site/.vercel/project.json`): Settings → Domains → adicionar `zapatro.com` e `www.zapatro.com`.
4. DNS no registrador: `A @ 76.76.21.21` e `CNAME www cname.vercel-dns.com` (ou trocar os nameservers para os da Vercel). Esperar o certificado HTTPS ficar válido.
5. Build com o domínio novo: `SITE_URL=https://zapatro.com bun run site:build`.
6. Ativar os redirects: copiar o array `redirects` de `site/vercel.redirects.example.json` para `site/vercel.json` (ao lado de `headers`). Cada regra usa `has: [{ type: 'host', … }]`, então só o host antigo redireciona: `www.zapatro.com`, `truco.lekzera.xyz` e `zapaco.vercel.app` → 308 para `https://zapatro.com/:path*`, mantendo o caminho (inclusive `/play/` e `/demo/`). Alternativa sem arquivo: "Redirect to" no painel de domínios da Vercel.
7. `bun run site:deploy` e conferir: `curl -sI https://truco.lekzera.xyz/presskit/` deve responder `308` com `location: https://zapatro.com/presskit/`; `curl -sI https://zapatro.com/` deve responder `200`.
8. Search Console: adicionar a propriedade `zapatro.com`, enviar `https://zapatro.com/sitemap.xml` e usar "Mudança de endereço" a partir da propriedade antiga.

## Lighthouse (2026-10-25, local, `site/out` servido por Bun)

- Medição com performance (Lighthouse 13.5.0, mobile e desktop, EN e PT, mediana de 3): ver [architecture.md § Desempenho medido](architecture.md#desempenho-medido-2026-10-25). Antes da limpeza de JS: desktop 99; mobile 74–82 (LCP 4,5 s no poster do trailer, TBT 154–717 ms). Depois: **100 nos quatro casos**, LCP mobile 1,5 s, TBT 29–33 ms e cerca de 95 kB por página no total (eram 577 kB). CLS 0.

- Mobile e desktop: acessibilidade 100 · boas práticas 100 · SEO 100 (Chrome DevTools MCP, que não mede performance). Peso da home sem vídeo: cerca de 230–440 kB (HTML, CSS, JS do Next, Rubik e poster WebP de 26 kB).

## Lighthouse (2026-10-01, produção)

- Mobile: performance 95 · acessibilidade 100 · boas práticas 100 · SEO 100.
- Desktop: acessibilidade, boas práticas e SEO 100; performance entre 59 e 90 nesta máquina, porque o antivírus (Kaspersky) intercepta o HTTPS, tira a compressão e atrasa cada pedido. Medir de novo fora dessa rede (PageSpeed Insights) antes do RC4.
