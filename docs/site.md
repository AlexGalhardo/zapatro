# Site oficial (`site/`)

Site estático do jogo (PLAN RC2, D-25 e D-88): **Astro (saída estática, sem adaptador) + Tailwind CSS v4 (`@tailwindcss/vite`)**, `package.json` e `bun.lock` próprios, sem React. Publicado no **GitHub Pages** em <https://alexgalhardo.github.io/zapatro/> (`/play/` jogo completo, `/demo/` demo). `truco.lekzera.xyz` e `beta.lekzera.xyz` eram os endereços antigos, na Vercel; o Next.js e a Vercel saíram do repositório em 2026-11-11 (D-88).

## Rotas

Todas as rotas ficam sob a base (`/zapatro/` no Pages); abaixo, caminhos relativos a ela.

| Rota | Conteúdo |
|---|---|
| `/` e `/pt/` | Home numa tela só no desktop (header 56 px, hero em `grid md:grid-cols-2`, footer): título ZAPATRO, tagline, pitch, botões JOGAR AGORA (`play/`) e Jogar a demo (`demo/`), linha de apoio e badges de loja à esquerda (máx. 36 rem), trailer 16:9 à direita; no celular a ordem é título, tagline, CTA, trailer, pitch, badges |
| `/presskit/` e `/pt/presskit/` | Ficha técnica (lançamento e preço "a definir"), descrição, história, destaques, trailer, as 6 capturas 1920×1080 do idioma da página, logo (PNG e SVG), ícone e cabeçalho, créditos, zip |
| `/privacy/` e `/pt/privacy/` | Política de privacidade ("não coleta dados", exigida pela Play) |
| `/play/` | Jogo completo (`bun run build`), aberto em nova guia pelo botão da home (janela inteira, tela cheia); `noindex` |
| `/demo/` | Demo web (`bun run build:demo`): Campeonato 1, termina depois do primeiro chefe (D-33); `noindex` |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Endpoints de `site/src/pages` (`sitemap.xml.ts`, `robots.txt.ts`, `manifest.webmanifest.ts`) a partir de `SITE_URL` e `SITE_BASE` |

Inglês fica na raiz e português em `/pt` (páginas em `site/src/pages` e `site/src/pages/pt`, o corpo de cada uma é um componente `.astro` que recebe `lang`; o layout é `src/layouts/Shell.astro`). Textos em `site/src/i18n.ts` (EN e PT-BR juntos); links de loja/Discord/contato em `site/src/links.ts` (`null` = badge "em breve"). Todo link e asset passa por `url()`/`abs()` de `links.ts`, que respeitam a base.

## Base e domínio (`SITE_URL`, `SITE_BASE`)

`site/astro.config.ts` lê duas variáveis de ambiente: `SITE_URL` (padrão `https://alexgalhardo.github.io`) e `SITE_BASE` (padrão `/zapatro/`). Elas valem para canonical, hreflang, Open Graph, sitemap, robots, manifest (`start_url`, `scope`, ícones), JSON-LD e todos os links. `trailingSlash: 'always'` e uma pasta por rota (`/pt/presskit/index.html`). As builds do jogo (`/play/`, `/demo/`) usam o `base: './'` do Vite, então funcionam sob qualquer prefixo.

Domínio próprio no futuro: `SITE_URL=https://exemplo.com SITE_BASE=/ bun run site:build` (ou as duas variáveis no passo de build do `deploy.yml`), mais o domínio em Settings → Pages do repositório e o DNS (`CNAME` para `alexgalhardo.github.io`, ou os registros `A` do Pages para o apex). O save do jogo web fica no `localStorage`, que é por origem: trocar de endereço (de `truco.lekzera.xyz` para o Pages, ou do Pages para um domínio próprio) deixa o progresso para trás; avise o jogador para usar "Exportar save" na origem antiga e "Importar save" (Configurações) na nova.

Limites do GitHub Pages: sem cabeçalhos próprios (a `X-Robots-Tag` e o cache imutável de `/play/assets/*` da época da Vercel saíram; o `noindex` fica só pela `<meta>` injetada no `index.html` do jogo e da demo) e sem redirects de servidor. O `robots.txt` só vale no raiz do domínio: sob `/zapatro/` ele é informativo até existir domínio próprio.

## Comandos

```text
bun run site:build                                  # arte de docs/media, jogo completo e demo, zip do presskit e astro build → site/out (+ .nojekyll)
bun run site:build -- --skip-demo                   # idem sem regerar /play e /demo
bun scripts/site-check.ts                           # ensaio do deploy: serve site/out sob /zapatro/ como o GitHub Pages e confere rotas, manifest, sitemap, links, noindex, /play e /demo
cd site && bun run dev                              # desenvolvimento do site (astro dev)
```

**Deploy:** todo push na `main` roda `.github/workflows/deploy.yml` (`site:build`, `actions/upload-pages-artifact` com `site/out` e `actions/deploy-pages`, ambiente `github-pages`); também há `workflow_dispatch`. Configuração única no repositório: Settings → Pages → Source = "GitHub Actions". Não há `site:deploy` à mão.

Antes do push que muda o site, rode `bun scripts/site-check.ts` (porta 5211, `--port` muda; `--base` troca o prefixo): ele serve `site/out` sob `/zapatro/`, devolve 404 fora do prefixo e falha em rota que não responde 200, em `robots.txt`, `sitemap.xml`, manifest ou imagem que não carregam, em HTML com URL absoluta de raiz fora da base, `noindex` ausente em `/play/` ou `/demo/`, partida rápida que não chega a 12, `/demo/` que não é a demo, erro de console ou HTTP ≥ 400.

Tudo em `site/public` é gerado por `scripts/site-build.ts` (gitignored); `site/public/img` é apagada e refeita a cada build. As imagens do site e do press kit vêm de `docs/media/` (geradas por `bun scripts/store-art.ts`): `presskit-logo.png|svg`, `store-steam-header.png`, `site-og.jpg` e `store-shot-0N-<nome>-<en|pt-BR>.png`. O trailer aparece sozinho quando `trailer/out/trailer-en.mp4` e `trailer-pt.mp4` existem no build (checado em tempo de build, sem requisição a arquivo ausente); legendas entram quando houver `site/public/trailer/trailer-en.vtt` e `trailer-pt.vtt` (copie-as para lá ou para `trailer/out/`, mesmo nome).

**Sem JS de framework nas páginas.** Os componentes são `.astro` (HTML no build); as duas partes interativas são nativas: o menu de idioma é um `<details>` e o trailer um `<video controls>`. O único script é o inline do `LangMenu.astro`, que aponta os links de idioma para a mesma página no outro idioma (sem JS, levam à home do outro idioma). O CSS vai inline (`build.inlineStylesheets: 'always'`). O poster do trailer sai em 480, 720 e 960 px (`trailer-poster-<lang>[-480|-720].webp`) com `srcset`/`sizes` e `preload` no `<head>` da home, e o celular baixa o de 720.

## Identidade visual (Art Bible v2, `game-director-feedback.md` §7)

- Fundo pintado (Art Bible v3): `art-src/gta/background-2.png` em WebP de 640, 1280 e 1920 px (`/img/bg-<largura>.webp`, gerados por `scripts/site-build.ts`; `global.css` escolhe por breakpoint, via variáveis `--bg-*` que o `Shell.astro` põe no `<html>` para respeitar a base) sob um véu escuro `rgb(26 17 22 / .62 → .8)` para o texto manter contraste; `#2B2B2B` só como cor de reserva. Leque de três cartas em SVG como marca-d'água atrás do título (só desktop).
- Tokens num lugar só, `site/src/styles/global.css` (`@theme` + `:root`): cores do jogo (`--color-bg`, `panel`, `panel-dark`, `gold`, `cream`, `text`, `chips`, `mult`, `cta` verde `#47B468` com texto `#1A1A1A`, `felt`), raio 8/6/4 (`rounded-panel|button|seal`), sombra sólida `0 4px 0 #1A1A1A` (`shadow-solid`), foco 3 px dourado com offset 2 px, movimento 150 ms `ease-out` (zerado com `prefers-reduced-motion`). Utilitários `btn`, `btn-cta`, `card`.
- Fonte única Rubik 400/500/700 pela API de fontes do Astro (`fonts` em `astro.config.ts`, provedor Google, `display: swap`, baixada e servida do próprio site no build).
- Trailer (`src/components/Trailer.astro`): `<video controls preload="metadata" playsinline>` com `poster` e `<track kind="subtitles">`; sem o MP4, o quadro 16:9 mostra o poster com o aviso "Trailer coming soon / Trailer em produção" marcado como imagem provisória. Poster por idioma: `/img/trailer-poster-<en|pt-BR>.webp` (960 px, da captura `store-shot-02-count-<idioma>.png`).
- Badges de loja: link real quando `site/src/links.ts` tem URL; com `null`, texto "(coming soon)/(em breve)" sem link.

## Press kit

- Página: capturas em WebP 1280×720 (`/img/press/<nome>-<idioma>.webp`, ~35–55 kB) com `width`/`height` e `alt` descritivo EN/PT (`shot.*` em `site/src/i18n.ts`); cada uma leva ao PNG 1920×1080. Logo em WebP 640 px ligado ao PNG 2048×640, link para o SVG, ícone 1024 e cabeçalho 920×430.
- Zip `/presskit/truco-roguelite-presskit.zip` (~3 MB): `icon-1024.png` e `press/` com `logo.png`, `logo.svg`, `header.png` e as 12 capturas PNG (6 por idioma). Sem key art: a cena de boteco em pixel art saiu do site.
- Números da ficha conferidos em `src/data` (2026-10-25): 8 Campeonatos, 60 Manhas, 10 chefes (9 sorteáveis + Rei do Truco), 10 companheiros, 5 baralhos, 8 Estacas, 7 modificadores, 8 Simpatias, 7 Lances.

## SEO

- `src/layouts/Shell.astro`: título por idioma ("Zapatro — A Truco Paulista Roguelite" / "Zapatro — Roguelite de Truco Paulista"; demais páginas "Press kit · Zapatro"), description, `canonical` por idioma, `hreflang` en, pt-BR e `x-default` → en, Open Graph (`website`, `site_name`, imagem 1200×630 com alt), `twitter:card summary_large_image` e `theme-color`.
- `og:image` = `img/og.jpg`, de `docs/media/site-og.jpg` (ou `.png`); sem ele o build falha.
- JSON-LD na home: `VideoGame` sempre; `VideoObject` só quando o MP4 do trailer existe.
- Ícones: `favicon.ico` (32 e 48 px; o sharp não grava ICO, então o build escreve o contêiner à mão com os dois PNG dentro), e em `img/`: `favicon.svg` (cópia de `art-src/app-icon.svg`), `apple-touch-icon.png` 180, `icon-192.png` e `icon-512.png` no manifest, `icon-64.png` de fallback.
- `/play/` e `/demo/` ficam fora da busca: o build injeta `<meta name="robots" content="noindex">` no `index.html` copiado.
- Canonical, sitemap, robots e manifest leem `SITE_URL` e `SITE_BASE` (ver "Base e domínio").

## Lighthouse (2026-10-25, local, `site/out` servido por Bun)

Histórico: medido no site antigo em Next.js na Vercel; refaça no Astro/Pages antes de citar estes números.

- Medição com performance (Lighthouse 13.5.0, mobile e desktop, EN e PT, mediana de 3): ver [architecture.md § Desempenho medido](architecture.md#desempenho-medido-2026-10-25). Antes da limpeza de JS: desktop 99; mobile 74–82 (LCP 4,5 s no poster do trailer, TBT 154–717 ms). Depois: **100 nos quatro casos**, LCP mobile 1,5 s, TBT 29–33 ms e cerca de 95 kB por página no total (eram 577 kB). CLS 0.

- Mobile e desktop: acessibilidade 100 · boas práticas 100 · SEO 100 (Chrome DevTools MCP, que não mede performance). Peso da home sem vídeo: cerca de 230–440 kB (HTML, CSS, JS do Next, Rubik e poster WebP de 26 kB).

## Lighthouse (2026-10-01, produção)

- Mobile: performance 95 · acessibilidade 100 · boas práticas 100 · SEO 100.
- Desktop: acessibilidade, boas práticas e SEO 100; performance entre 59 e 90 nesta máquina, porque o antivírus (Kaspersky) intercepta o HTTPS, tira a compressão e atrasa cada pedido. Medir de novo fora dessa rede (PageSpeed Insights) antes do RC4.
