# Roteiro de lançamento da 1.0 (passo a passo do dev)

Roteiro humano, em ordem. Consolida [launch-game.md](launch-game.md), [release-checklist.md](release-checklist.md), [site.md](site.md), [desktop.md](desktop.md), [mobile.md](mobile.md), [steam-achievements.md](steam-achievements.md), [store-page.md](store-page.md), [CREDITS.md](../CREDITS.md) e a seção 7 de [game-director-implementation.md](game-director-implementation.md).

Custos marcados "conferir" não estão confirmados neste repositório: confirme na página oficial antes de pagar. Nenhum ID, data ou preço abaixo foi inventado.

## Dependências entre passos

- App ID da Steam antes de `steamAppId` em `desktop/package.json` e de `app_build.vdf`.
- Conta da Play Console antes do AAB assinado e antes da ficha da loja.
- Domínio `zapatro.com` antes de apontar o GitHub Pages para ele (`SITE_URL`/`SITE_BASE`, Settings → Pages e DNS; ver [site.md](site.md)).
- Aviso de exportar o save publicado no `/play/` antigo ANTES de trocar o endereço (sem isso, quem joga em `truco.lekzera.xyz` ou no GitHub Pages perde o progresso ao migrar para o domínio novo, porque o save fica no `localStorage` de cada origem).
- Página "Em breve" da Steam publicada ≥ 2 semanas antes do lançamento.
- Build da tag `v1.0.0` antes de qualquer envio às lojas.

## Fase 1: decisões

1. **Marca.** Buscar "Zapatro" no INPI (classes 9 e 41) e no USPTO. Onde: sites oficiais do INPI e do USPTO. Custo: conferir. Feito quando o resultado estiver registrado em `docs/decisions.md`.
2. **P-06 (dados da Sortuda).** Decidir e registrar em `docs/decisions.md`. Feito quando a decisão estiver escrita.
3. **P-07 (precedência GDD × PLAN).** Decidir qual vale quando divergirem. Feito quando registrado em `docs/decisions.md`.
4. **Próximo custo de pular mesa (GD-020).** Hoje pular Pequenas e Grandes ainda domina (+12 a +15,5 p.p.). Opções já citadas: um pulo por Campeonato. Onde: `bun scripts/sim.ts --skip none|small|both`, depois `bun run balance`. Feito quando o balanceamento passar e `docs/balancing.md` tiver o resultado.
5. **Recalibração das Estacas (GD-021).** Quatro degraus estão fora da faixa de 5 a 8 p.p. Onde: `bun scripts/stakes.ts --runs 1000`. Feito quando a curva for decidida e o resultado estiver em `docs/balancing.md`.
6. **Preço (Q-02).** Base em USD (PLAN cita US$ 9,99, provisório), com preço regional BR. Feito quando a decisão estiver em `docs/decisions.md` e na página da Steam.
7. **Data de lançamento.** Decidir ou manter "a definir" na página. Feito quando estiver decidido (a página não pode prometer data que não se cumpre).

## Fase 2: contas e licenças

1. **Steamworks.** Conta de parceiro em partner.steamgames.com. Custo: Steam Direct US$ 100 (conferir). Entrevista fiscal (W-8BEN) e verificação de identidade. Prazo: 2 a 7 dias (conferir). Feito quando a conta estiver aprovada.
2. **App ID e depots.** No Steamworks, criar o app e três depots (Windows, Linux, macOS). Preencher `steamAppId` em `desktop/package.json` e os IDs em `desktop/steam/app_build.vdf` (ver [desktop.md](desktop.md) e [launch-game.md](launch-game.md) §3.2). Feito quando o `steamAppId` estiver no commit e o `app_build.vdf` com os IDs reais.
3. **Usuário de build.** Criar uma conta Steam só para o SteamCMD, com permissão de editar metadados e publicar. Nunca usar a conta principal. Feito quando o login do SteamCMD funcionar.
4. **Google Play Console.** Conta de desenvolvedor em play.google.com/console. Custo: US$ 25 (conferir). Conta pessoal nova exige teste fechado de 14 dias com 12 testadores (conferir a regra atual). Feito quando a conta estiver verificada.
5. **Chave de upload do Android.** Gerar com `keytool` fora do repositório (`C:\chaves\`). Guardar o `.jks`, as senhas e o alias. Colocar os secrets `ANDROID_KEYSTORE_*` e `ANDROID_KEY_ALIAS` no GitHub. Ver [launch-game.md](launch-game.md) §4.1. Feito quando o `release.yml` gerar o AAB assinado.
6. **itch.io.** Criar a conta em itch.io e a página (ver [launch-game.md](launch-game.md) §5). Custo: grátis (a taxa é a porcentagem do itch, conferir). Feito quando a página estiver em Draft com a demo web.
7. **Poki.** Conta em developers.poki.com e candidatura. Antes de assinar, perguntar sobre exclusividade web (conflito em aberto, [launch-game.md](launch-game.md) §6). Feito quando a Poki responder à candidatura.
8. **Planos comerciais.** Confirmar o plano pago do ElevenLabs e do PixelLab para uso comercial. Datar em `CREDITS.md`. Custo: conferir em cada plataforma. Créditos do PixelLab resetam em 2026-10-26 (ver seção 7 de `game-director-implementation.md`).
9. **Certificado de assinatura do Windows.** Certificado de código (ou Azure Trusted Signing). Custo: conferir. Sem ele, o SmartScreen avisa o jogador. Feito quando o `.exe` sair assinado.
10. **Apple (só se houver build macOS fora da Steam).** Conta Apple Developer e notarização. Custo: conferir. Pode ficar de fora se o macOS sair só pela Steam.

## Fase 3: builds

1. **Gates.** Na raiz: `bun run check`, `bun run typecheck`, `bun test`, `bun run lint:md`, `bun run build`. Feito quando todos passarem sem erro.
2. **QA.** `bun scripts/qa.ts --url http://localhost:5191` (com `vite preview` ou dev server), `bun scripts/smoke.ts`, `bun scripts/qa-devices.ts --set desktop` e `--set mobile`. Ver [quality-assurance-functional-systems-global-test.md](quality-assurance-functional-systems-global-test.md). Feito quando a rodada estiver registrada.
3. **Balanceamento.** `bun run balance` (PASS) e a sim por companheiro registrada em `docs/balancing.md`.
4. **Tag e release.** Criar a tag `v1.0.0` pela skill `release-section`, com a seção `## [1.0.0]` do CHANGELOG. Depois `bun run release`: anexa os zips web, o Electron Windows e Linux, o APK de debug e o `checksums.txt`. Feito quando o GitHub Release existir com as notas.
5. **`.exe` do Windows.** `bun run exe` gera `Zapatro-1.0.0-win-x64.exe` na raiz (gitignored). Assinar com o certificado do passo 2.9. Feito quando o `.exe` assinado rodar.
6. **AAB assinado.** Pelo `release.yml` com os secrets, ou localmente com `bun run android:bundle` e as variáveis `ANDROID_KEYSTORE_*` ([launch-game.md](launch-game.md) §4.1). Feito quando `zapatro_1.0.0_android.aab` estiver no Release.
7. **Teste em hardware.** Steam Deck (gamepad real, texto a 30 cm), Android real (não só o emulador, `bun run android:run` ou o `qa-android.ts`), e um Windows limpo com o `.exe`. Feito quando os três passarem a partida rápida e um save.
8. **Escuta de 15 minutos** da mixagem (GD-018): menu, mesa, truco, contagem, loja, chefe. Feito quando anotado no registro de QA.
9. **Três runs humanas completas** (PLAN A6.4), com relatório. Feito quando o relatório estiver em `docs/`.

## Fase 4: lojas

1. **Steam, página "Em breve".** Store Admin → Edit Store Page. Usar o material de `docs/media/` e os textos de [store-page.md](store-page.md). Cadastrar as 37 conquistas da planilha [steam-achievements.md](steam-achievements.md). Conferir o requisito de disco (200 MB em `store-page.md` x 400 MB em `launch-game.md` §3.3). Enviar para revisão. Feito quando a página for aprovada e publicada como "Em breve" (começa a contagem de 2 semanas).
2. **Steam, conquistas.** Cadastrar e publicar as 37 conquistas com o API name = id do feito (ver [steam-achievements.md](steam-achievements.md)). Feito quando o teste de `beta` desbloquear uma e ela não repetir após reiniciar.
3. **Steam, build.** Ensaio com `"Preview" "1"` e depois envio pelo SteamCMD (`launch-game.md` §3.4). Mover para a branch `default` manualmente. Feito quando a Steam aprovar o build.
4. **Steam, lançamento.** Pagamento e 30 dias desde a compra (primeiro jogo da conta, conferir). Clicar Release App. Feito quando a página estiver à venda.
5. **Google Play.** Ficha da loja (título, descrição curta e completa, categoria, tags, ícone 512, gráfico 1024×500 e capturas, de [store-page.md](store-page.md)). Classificação IARC. Teste interno, teste fechado de 14 dias e produção com lançamento gradual. Feito quando o lançamento de produção estiver no ar.
6. **itch.io.** Página com os textos de [store-page.md](store-page.md), o aviso de IA e os zips (web, Windows, macOS, Linux, APK). Mudar de Draft para Public. Feito quando a página estiver pública.
7. **Poki.** Enviar o `zapatro_1.0.0_web-poki.zip`, responder o formulário e aguardar. Antes do envio, conferir que o botão "Wishlist" está escondido no build Poki (`launch-game.md` §6.5). Feito quando a Poki publicar o jogo.

## Fase 5: site e domínio

1. **Aviso de exportar o save.** Publicar no `/play/` e `/demo/` antigos o aviso para exportar o save (`settings.export`) antes de migrar. Fazer ANTES do redirect. Feito quando o aviso estiver no ar.
2. **Domínio.** Registrar `zapatro.com`. Custo: conferir. Feito quando o domínio estiver na conta do dev.
3. **GitHub Pages.** Pôr o domínio em Settings → Pages, configurar o DNS e o HTTPS e fixar `SITE_URL=https://zapatro.com` e `SITE_BASE=/` no build do `deploy.yml` ([site.md](site.md)). Feito quando `https://zapatro.com` abrir.
4. **Endereços antigos.** O GitHub Pages não faz redirect de servidor e `truco.lekzera.xyz` era da Vercel: decidir com o dev se o domínio antigo some ou ganha uma página de aviso. Feito quando a decisão estiver registrada.
5. **Republicar o jogo.** `bun run site:build` e push na `main` (o `deploy.yml` publica), com `SITE_URL` novo. Feito quando `/play/` e `/demo/` estiverem do build 1.0.
6. **Validar.** OG, Twitter e JSON-LD (`VideoGame`, `VideoObject`), `robots.txt` e `sitemap.xml`. Lighthouse mobile e desktop ≥ 90 em performance, e 100 nos demais (hoje a performance não foi medida). Feito quando o Lighthouse estiver registrado.
7. **Links de loja.** Preencher `steam`, `play` e `itch` em `site/src/links.ts` e fazer push na `main` de novo. Feito quando os botões da home apontarem para as lojas.

## Fase 6: marketing

1. **Trailer 60 s e teaser 15 s**, EN e PT-BR. Render pelo `trailer/` (`bun run render`, ver [trailer.md](trailer.md)); revisão humana do render. Feito quando os dois cortes estiverem aprovados.
2. **YouTube.** Publicar o trailer e linkar em Steam, site e Play. Feito quando o link estiver na página da Steam.
3. **GIF de 10 segundos** (mão trucada e contagem) para Steam, itch e redes. Feito quando o arquivo estiver em `docs/media/`.
4. **Demo.** A demo web já está em `/demo/`. Inscrever-se no Steam Next Fest, se a janela cair antes do lançamento. Feito quando a inscrição for aceita ou a decisão de não participar estiver anotada.
5. **Discord e e-mail de contato.** Publicar em `site/src/links.ts`. Feito quando os links estiverem na home.
6. **Imprensa.** Lista de imprensa com o zip do press kit (logo, header, capturas). Texto de lançamento em `docs/patch-notes-1.0.md`, revisado. Feito quando a lista estiver enviada.

## Fase 7: dia do lançamento

1. Confirmar o estado das lojas: Steam à venda, Play em produção, itch público, Poki publicado, site em `zapatro.com` com os redirects.
2. Publicar as notas de versão: Community → Events & Announcements (Steam), notas da versão (Play), Devlog (itch) e a página de patch notes do site.
3. Publicar o post de lançamento nas redes e a nota à imprensa.
4. Monitorar: Android vitals na Play, wishlists e vendas na Steam, dados da Poki, e a caixa de erros do GitHub.
5. Anotar no `docs/game-director-implementation.md` a data real do lançamento e os links finais.
