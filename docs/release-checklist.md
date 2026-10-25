# Checklist de lançamento (R4.3)

Baseado em `ccgs-release-checklist` / `ccgs-launch-checklist`, reduzido ao que se aplica a um jogo web + executáveis publicado por uma pessoa. Rode antes de cada tag `v*`.

Estado em 2026-10-25 (`package.json` em 0.10.0): o material de loja já existe (`docs/media/`, textos em [store-page.md](store-page.md)). O que resta nas lojas é humano (conta, App ID, páginas, preço, assinatura, licenças), listado em [launch-game.md §1.1](launch-game.md#11-estado-em-2026-10-25). Itens sem marca abaixo são pendência humana ou de build ainda não rodado.

## Build e qualidade

- [x] Gates: `bun run check`, `bun run typecheck`, `bun test`, `bun run build`
- [x] `bun run balance` PASS (3 carreiras)
- [x] `bun scripts/qa.ts` 100% no build de produção (`vite preview`, `?qa=1`) — também no CI (job `qa`)
- [x] `bun scripts/qa-browsers.ts`: Chrome, Edge e Firefox sem erros, sem scroll, 1366×768 → 4K e retina
- [x] Soak curto (`qa.ts --soak 300`): heap estável
- [x] Executáveis: `release.yml` compila Linux/macOS/Windows (x64 e arm64) e roda `--smoke` no nativo
- [x] Tamanho: `dist/` 7,4 MB (< 8 MB), JS 1,6 MB (≈ 0,42 MB gzip), nomes com hash; arte e som de boss sob demanda

## Conteúdo e texto

- [x] Zero texto fora do i18n (teste `tests/i18n.test.ts`), EN e PT-BR com as mesmas chaves
- [~] Créditos e licenças: [CREDITS.md](../CREDITS.md) + linha de créditos na aba Estatísticas: chave `stats.credits` (EN e PT-BR) criada; a exibição na tela ainda não está ligada (falta o `this.put` em `AlmanacScene.stats`, agente H)
- [ ] Confirmar o plano pago do PixelLab e do ElevenLabs para uso comercial (ver CREDITS.md)
- [x] Arte 100% no jogo (149/149) — ver [asset-status.md](asset-status.md)

## Página e distribuição

- [x] Textos EN/PT-BR, tags e requisitos: [store-page.md](store-page.md) (conferir os números antes de publicar)
- [x] Arte e capturas de loja: `docs/media/` (`bun scripts/store-art.ts` e `bun scripts/store-shots.ts`)
- [ ] Conferir na Steam os requisitos (disco: 200 MB em store-page.md, 400 MB em launch-game.md §3.3)
- [ ] GIF de gameplay (manual)
- [ ] Criar a página no itch.io ([launch-game.md](launch-game.md)), subir `zapatro_<versão>_web.zip` (HTML5, 1280×720, "fullscreen button") e os executáveis
- [ ] Tag `vX.Y.Z` → `git push origin vX.Y.Z` publica o GitHub Release com as notas do CHANGELOG

## Telas

- [ ] `bun scripts/qa-devices.ts --set desktop` e `--set mobile` sem erros; revisar as capturas
- [ ] `bun scripts/qa-android.ts` verde no emulador `gridbound_s20fe` (ou no S20 FE)

## Steam (Electron) — [launch-game.md](launch-game.md)

- [ ] Job `electron` verde no CI; `zapatro_*_{windows,linux,darwin}_*.zip` no GitHub Release
- [ ] App ID e depots no `desktop/steam/app_build.vdf`; opções de inicialização (Linux com `--no-sandbox`) publicadas
- [x] Artes (capsules, library, hero, logo) e capturas 1920×1080 prontas em `docs/media/`
- [ ] Página da loja (conta Steamworks, App ID) aprovada e "Em breve" há ≥ 2 semanas (humano)
- [ ] Assinatura do `.exe` Windows (certificado de código; sem ele o SmartScreen avisa) — decisão e custo humanos
- [ ] Build enviado pelo SteamPipe, testado em Windows/Linux/Steam Deck, aprovado; build na branch `default`

## Google Play (Capacitor) — [launch-game.md](launch-game.md)

- [ ] Job `android` verde; AAB assinado (secrets `ANDROID_KEYSTORE_*`) no GitHub Release
- [ ] Testado no Galaxy S20 FE (checklist do doc)
- [x] Política de privacidade no ar (`https://truco.lekzera.xyz/privacy`); arte da loja em `docs/media/` (ícone 512, gráfico 1024×500, capturas)
- [ ] Questionários IARC, segurança dos dados e público-alvo, e preenchimento da página na Play Console (humano)
- [ ] Teste interno → teste fechado (12 testadores/14 dias em conta pessoal nova) → produção

## Depois do lançamento

- [ ] Acompanhar erros reportados (o overlay de erro permite baixar o log)
- [ ] Rodar `bun scripts/qa.ts` e `bun run balance` a cada patch
