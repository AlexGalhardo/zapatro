# Game Director Feedback — Zapatro, revisão final antes da 1.0 Stable

> Data: 2026-10-25 · Branch `main` em `f6cde64` (`package.json` 0.10.0, com uma alteração não commitada: `name` → `zapatro.com`) · Build testado: `bun run dev` na porta 5191 e `bun run build` (produção) · Autor: revisão de direção (arquitetura + game design) para os agentes implementadores (Claude Opus 5.5), que não têm acesso a esta sessão.
> Regra de leitura: toda afirmação importante aponta arquivo:linha, captura em `docs/game-director-evidence/` ou saída de comando. "Não verificado" significa que não consegui comprovar e explico por quê. Nada foi alterado no código, nos assets ou na configuração do projeto; as únicas escritas são este arquivo e as capturas.
> Revisão anterior: `game-director-review.md` (2026-10-24, gitignored). Todos os seus itens receberam status na seção 3.

## 1. Veredito executivo

**Decisão: NO-GO para a 1.0 Stable comercial na Steam. O jogo em si está em GO com ressalvas; o que bloqueia é a prontidão comercial.**

Jogabilidade, regras e estabilidade estão sólidas: 268 testes unitários, 91/91 checagens do QA headless, smoke e 6 runs completas do bot sem um único erro de console, save resistente a corrupção e a versão futura, 16 combinações de resolução/DPR sem quebra de layout. O que impede o lançamento comercial hoje é tudo o que fica fora do canvas: a Steam não existe (`steamAppId: null`, `app_build.vdf` sem App ID, nenhuma cápsula ou captura de loja no repositório), o trailer não existe no checkout (`trailer/out` ausente; o site mostra "The trailer is on its way"), as licenças comerciais do PixelLab e do ElevenLabs continuam "a confirmar" em `CREDITS.md`, a marca Zapatro não foi checada em base oficial, e o executável Windows sai sem assinatura. Além disso há dois defeitos de experiência que um jogador vê na primeira hora: o Pacote de Baralho (4 opções) não cabe na tela e corta as cartas das pontas (GD-001), e a Partida rápida termina por "Meta batida!" em uma mão, contradizendo o GDD ("Truco puro a 12") e esvaziando o modo (GD-002). Nenhum deles é crash, mas os dois são visíveis e baratos de corrigir. Resolvidos os 10 itens abaixo, o veredito vira GO.

### Notas por dimensão (0–10)

| Dimensão | Nota | Justificativa curta |
|---|---|---|
| Gameplay | 8 | Regras do Truco Paulista batem com PLAN §5 nos testes jogados (encoberta, truco/aumento, correr, mão de 11, mão de ferro, sinais, ZAP); IA não trapaceia (`observe`). Partida rápida errada (GD-002); regra do chefe invisível na mesa (GD-003). |
| Balanceamento | 7 | Gate D-39 PASS nas 3 seeds (bot bom 45,0–45,6 %, aleatório 1,2–1,6 %, 4,5 mãos/mesa); bot venceu 2 de 3 runs na Estaca 1 e 1 de 2 na Estaca 8 (amostra pequena). Pular mesa continua dominante e sem decisão (GD-020). |
| UI/UX | 7 | Layout híbrido limpo e consistente em 16 resoluções; selos de atalho em tudo. Pack cortado (GD-001), moldura do tutorial errada (GD-005), fim de run vazio (GD-006), rodapés sobrepostos (GD-009/010). |
| Arte | 7,5 | Retratos pixel art nítidos em zoom inteiro, vetor chapado coerente com a Art Bible v2. Divergências: selo do ZAP/manilha (GD-011), fundo do retrato por personagem e não por papel (seção 3, C-12), ultrawide só com barras neutras. |
| Áudio | 6 | Catálogo completo (24 SFX, 6 músicas, 8 ambiências, 14 vozes × 8 falas); `caiu`/`oloco` já têm gatilho. Mixagem, loops e cortes **não verificados** (headless, sem saída de áudio); orçamento web 8,5 MB > 8 MB do Poki; `vo.juninho.oloco.2` ausente. |
| Texto e localização | 7 | 815 chaves EN e PT-BR completas, zero chave crua. Strings proibidas pela Art Bible ("sem truco") em 5 textos PT-BR (GD-004); gênero fixo nos estilos (GD-007); "Quedas 0 / theirs" (GD-008); "1 mãos". |
| Estabilidade técnica | 8,5 | Zero erro de console em ~230 páginas carregadas; save com `.bak`, quarentena e proteção de versão futura funcionando; resize ao vivo sem erro; build de produção em 22 s, JS 1,66 MB (451 kB gzip). B-01 (crash `drawImage` no Electron) segue aberto e **não reproduzido** aqui. |
| Prontidão comercial | 3 | Steam, Google Play, itch.io e Poki em `[ ]` (PLAN RC4.2–RC4.5, L1–L5); sem App ID, cápsulas, capturas, trailer, assinatura de código, licenças confirmadas, classificação etária ou marca registrada. Política de privacidade existe e é correta. |

### Os 10 problemas mais urgentes

1. **GD-013** Steam não configurada: `desktop/package.json` `steamAppId: null`, `desktop/steam/app_build.vdf` sem App ID/depots, nenhuma cápsula/captura de loja (`docs/media/` e `docs/store-page.md` não existem apesar de citados em `docs/release-checklist.md`).
2. **GD-014** Licenças comerciais do PixelLab e do ElevenLabs "a confirmar" (`CREDITS.md`, PLAN RC4.5) e marca "Zapatro" sem busca em INPI/USPTO (PLAN Q-01).
3. **GD-001** Pacote de Baralho com 4 opções não cabe no palco de 640 px: a 1ª e a 4ª carta saem cortadas (`src/scenes/RunScene.ts:1217`, passo de 175 px × 4).
4. **GD-002** Partida rápida usa a meta de pontos da Mesa Pequena (110) e acaba em 1 mão com "Meta batida!" (`src/scenes/TableScene.ts:347`); o GDD §11 define "Truco puro a 12".
5. **GD-012** Trailer ausente: `trailer/out/` não existe e o site mostra o placeholder; PLAN RC3.4 diz "renderizados e publicados".
6. **GD-027** B-01 (P0, crash `Cannot read properties of null (reading 'drawImage')` no Electron) continua `[ ]` em `BUGS.md:19`; não reproduzido nesta sessão (sem build Electron).
7. **GD-004** Vocabulário proibido pela Art Bible v2 §5 ("sem truco") visível na sidebar de toda mesa (`src/i18n/pt-BR.ts:159`) e em mais 4 textos; `tests/vocabulary.test.ts` não cobre a string.
8. **GD-003** A regra do chefe não aparece na mesa do chefe (só na seleção); o jogador tem de decorar.
9. **GD-005** Tutorial passo 3 ("Placar e aposta") desenha uma moldura que une a sidebar ao HUD do canto oposto (`src/scenes/TableScene.ts:429`).
10. **GD-016/015** Docs desatualizados que vão confundir os agentes: `docs/release-checklist.md:11` ("150 monstros", sobra do Gridbound), `docs/asset-status.md:3` ("branch balatro-style"), GDD §13.2 (HUD antigo), §12 (telas "pendente"), §14 (`caiu`/`oloco` "sem gatilho", já têm).

## 2. Metodologia e limitações

### O que foi testado e como

| Etapa | Ferramenta | Evidência |
|---|---|---|
| Gates | `bun run typecheck`, `bun run check`, `bun run lint:md`, `bun test` | tsc limpo; Biome "Checked 204 files, no fixes"; markdownlint 0 issues; **268 pass, 0 fail** (30 arquivos, 25,8 s) |
| Build | `bun run build` | `✓ built in 2.71s`, total 22,5 s; `dist/assets/index-DWW8xp4p.js` 1.660 kB (gzip 451 kB); `dist/` 11 MB (8,5 MB de áudio) |
| Smoke | `bun scripts/smoke.ts --url http://localhost:5191` | menu + partida com bot a 4×, "no console errors" |
| QA funcional | `bun scripts/qa.ts --url http://localhost:5191` (21 grupos) | **all 91 checks passed** |
| Balance | `bun run balance` (3 seeds × 500 runs) | **PASS** nas 3 seeds: bot bom 45,2 % · 45,6 % · 45,0 % (meta 40–60 %), aleatório 1,6 % · 1,6 % · 1,2 % (< 5 %), 4,51 · 4,49 · 4,51 mãos/mesa, sem NaN |
| Runs completas no jogo real | script Playwright próprio (`?run=1&auto=1&speed=4`), 6 runs: seeds 11, 12, 13 (Estaca 1), 21 (`demo=1`), 31, 32 (`stake=8`) | 4 vitórias (C8 chefe), 2 derrotas (C4 e C5); 0 erros; heap 51–58 MB → 63–85 MB por run; 59–459 s a 4× |
| Regras jogadas | script Playwright próprio (encoberta, truco/aumento, correr, mão de 11, mão de ferro, sinais, ZAP, partida rápida, tecla dupla) | 16 checagens, saída na seção 4 |
| Robustez | script Playwright próprio: save corrompido, save de versão futura, resize ao vivo (800×600, 2560×1080, 1280×800, 640×360, 1920×1080), recarga no meio da mão (via `qa.ts` grupos `save`/`continue`), cliques/teclas rápidas | todos PASS, 0 erros (seção 4, Estabilidade) |
| Telas | 44 telas em 1280×720 e 1920×1080 (EN e PT-BR) + 10 telas em 16 combinações de resolução/DPR = 160 capturas; heurística de sobreposição de textos (interseção ≥ 50 % de objetos `Text` visíveis) e de texto fora da câmera | `docs/game-director-evidence/` (93 arquivos); 0 sobreposições e 0 textos fora da câmera em 160 capturas; 3 timeouts por contenção, refeitos com sucesso |
| Site | Playwright em <https://truco.lekzera.xyz/> (1920×1080, 1366×768, 390×844 móvel), `/pt/`, `/presskit/`, `/privacy/`, `/play/`, `/demo/` | todos 200; metadados e estrutura na seção 7 |
| Código | leitura dirigida para localizar a causa de cada achado observado (grep/sed) | arquivo:linha em cada achado |
| Pesquisa | Steam Hardware & Software Survey (agosto de 2026) via busca web + `docs/steam-monitor-resolution-market-research.md`; busca por "Zapatro" | seção 4.8 e 4.9 |

Resoluções testadas (10 mais usadas da Steam em agosto de 2026 + Steam Deck + extras + DPR): 1920×1080 (50,52 %), 2560×1440 (21,86 %), 2560×1600 (5,71 %), 3840×2160 (4,98 %), 3440×1440 (3,14 %), 1920×1200 (2,76 %), 1366×768 (2,23 %), 1440×900, 1600×900, 2560×1080, 1280×800 (Steam Deck), 1280×720, 1536×864, 1920×1080 @2×, 1366×768 @1,25×, 1280×720 @1,5×. Fontes: Valve (Primary Display Resolution, agosto de 2026) citada em <https://www.pcgamesn.com/steam-hardware-survey-resolution> e <https://www.fixgamingchannel.com/ultrawide-gaming-2026-steam-data/>; os números coincidem com `docs/steam-monitor-resolution-market-research.md`.

### Limitações (não verificado)

- **Áudio:** sessão headless sem saída de som. Mixagem, volumes relativos, estalos de loop, cortes e comportamento ao perder o foco **não foram ouvidos**. Verifiquei por código: `pauseOnBlur: true` no SoundManager do Phaser (consulta ao vivo `g.sound.pauseOnBlur`), catálogo de arquivos e gatilhos.
- **Electron e Android:** não rodei `electron:dev`, `electron:build` nem o APK. B-01 (P0) segue não reproduzido. O `.exe` 0.10.0 existe na raiz mas não foi aberto.
- **Modo tela cheia e janela:** o teste foi em viewport headless; `Tela cheia` da Configurações não foi acionada (Fullscreen API exige gesto do usuário).
- **FPS:** o Chromium headless usa SwiftShader (render por software): 25–32 FPS médios não representam uma GPU real. Não há medição de FPS em hardware.
- **Vazamento de memória:** só runs de até 8 minutos a 4×; o heap sobe ~30 MB por run e não voltei a medir após GC. `bun scripts/soak.ts` (30 runs) não foi rodado por tempo.
- **Gamepad físico:** só o pad falso do `qa.ts` (grupo `deck`, PASS).
- **Busca de marca:** busca web genérica por "Zapatro" sem resultados de jogo homônimo; **não** consultei INPI/USPTO/EUIPO.
- **Subagentes:** o classificador do modo automático negou a criação de agentes auxiliares; toda a auditoria foi feita inline.

## 3. Verificação da revisão anterior

Status: `Resolvido` · `Parcial` · `Não resolvido` · `Regressão` · `N/A` (não aplicável ou discordo, com justificativa).

### 3.1 Diagnóstico (§2 da revisão anterior)

| Item | Status | Evidência no jogo atual | O que falta |
|---|---|---|---|
| G-01 Rivais sem identidade | Resolvido | `src/data/companions.ts` (10 ids, `style`, `perk`, `flaw`); rivais com estilo do companheiro sobre o pool (`src/game/run-table.ts`); tooltip de perk/flaw na seleção (CHANGELOG 0.10.0) | — |
| G-02 Parceiros fixos | Resolvido | `src/logic/run/draw.ts` + `drawCandidates`; tela mostra 3 cartões (`TELA-partner…`, `GD-007-parceiro-genero-1280x720.png`) | — |
| G-03 Pular mesa dominante | Não resolvido | `src/game/run-sim.ts:84` `skip: { small: false, big: false }`; `docs/decisions.md` 2026-10-01 "pendente decisão do usuário"; GDD §5.3 | Decisão P-08 (ver GD-020) |
| G-04 Dona Cida hardcoded | Resolvido | `grep donaCida src/game/run-table.ts` = 0; traço `honestSignals` em `companions.ts` | — |
| G-05 Bot só conhece Tonhão/Cida | Resolvido | 6 runs do bot com parceiros `tiao`, `donaCida`, `bia`, `neide`, `lurdes` (seção 2) | — |
| G-06 Sinal flagrado do rival só na barra | Parcial | `src/scenes/TableScene.ts:1444-1446` mostra texto `table.caught`; não há selo de 32 px no retrato | Selo/ícone no cartão do rival (Art Bible §2 "sinal vira selo") |
| D-01 Passivas na camada Fichas × Mult | Resolvido | Modelo de duas camadas implementado (`Trait` + `callMult`/`catchBonus`/`bluffChips` em `companions.ts`) | — |
| D-02 Testes de estilo fixos | Resolvido | `tests/companion-styles.test.ts`, `bun run balance` PASS (CHANGELOG 0.10.0: bot bom 45 %) | — |
| D-03 Curva pode achatar | Parcial | Balance PASS na Estaca 1; Estaca 8: bot venceu 1 de 2 runs (seeds 31, 32) | Rodar `bun scripts/stakes.ts` com o elenco novo e registrar em `docs/balancing.md` |
| D-04 Itens inexistentes nos concepts | Resolvido | Loja usa dados reais (`TELA-shop-1280x720.png`) | — |
| D-05 Seleção com dados do concept | Resolvido | `TELA-select…` mostra pool real e metas 110/165/220 | — |
| D-06 "$" com dois sentidos | Resolvido | Cartão "Meta 0 / 110" sem "$" (`GD-004-sidebar-sem-truco-1280x720.png`) | — |
| C-01 HUD/rótulos do Malandro | Parcial | Rótulos trocados (Campeonato · Mesa, Meta, Fichas × Mult, Aposta, Tentos deles, $); `tests/vocabulary.test.ts` existe | "sem truco" (lista proibida de `docs/visual.md` §5) ainda em 5 strings PT-BR e fora do teste (GD-004) |
| C-03 HUD sem Manhas/Fama/tentos NÓS | Resolvido | Bloco HUD no canto superior direito do feltro (5 slots, Fama, 12 ovais, quedas) em toda captura de mesa | — |
| C-04 Imagens no estilo antigo | Resolvido | Pausa e fim de run por código no estilo novo (`TELA-pause…`, `GD-006…`) | — |
| C-05 Manilha/ZAP sem referência | Parcial | Borda dourada implementada; selo ★ no canto do ZAP, manilha só com borda (`GD-011-zap-selo-1280x720.png`) | Art Bible §6 pede placa dourada no rodapé ("ZAP" para paus, ★ nas outras): ou o código segue a bible ou a bible segue o código (GD-011) |
| C-06 Marcas reais / dados da Sortuda | Não verificado | Não cheguei à mesa da Sortuda numa run; `public/assets/gfx/portrait/sortuda.png` existe. Pedrão fora do elenco (confirmado em `companions.ts`) | Inspecionar `sortuda.png` (P-06) |
| C-07 Falta O Mudo | Resolvido | `art-src/portrait/mudo.png` + `public/assets/gfx/portrait/mudo.png`; aparece na seleção (`GD-003-selecao-chefe…` mostra O Mudo) | Feito no PixelLab, contra a opção (a) da revisão; aceitável |
| C-08 Menu sem Tutorial | Resolvido | Menu com 7 linhas no web (8 no Electron) (`TELA-menu-1280x720.png`) | — |
| C-09 Fichas teal | Resolvido | `src/config/palette.ts:46` `chips: 0x3f7fc0`, `:57` `signal: 0x2fa7b8` | — |
| C-10 Fonte Roboto | N/A | Dev manteve Rubik (`package.json` só `@fontsource/rubik`; `docs/visual.md` §4) | Decisão registrada; nada a fazer |
| C-11 10 expressões × 1 retrato | Resolvido | Só `neutral` nos PNG; `EXPRESSIONS` segue em `characters.ts:4` sem bitmap | — |
| C-12 Fundos dos retratos sem regra | N/A (divergente) | Fundo por **personagem** (`src/art/flat.ts:1176` `portraitBg(id)`), não por papel: Tonhão vermelho, Joca verde, Juninho azul na mesma mesa | `docs/visual.md` §7 diz "o jogo pinta o disco"; decidir a regra (por papel ou por personagem) e alinhar doc e código |
| C-13 Controles/Configurações com tudo | Resolvido | Controles lista 13 ações; Configurações com 3 colunas completas (`TELA-controls…`, `TELA-settings…`) | — |
| C-14 Retratos "pixel-flavored" | Resolvido | 20 PNG 128×128 em `public/assets/gfx/portrait/`; nítidos em zoom 2/3/4/6 (`RES-mesa-*.png`) | — |
| C-15 Célula "ZAP" em ui-icons | Resolvido | 11 ícones cortados em `public/assets/gfx/icon/` (`bun scripts/icons.ts`); sem o retrato | — |
| C-16 Cigarro nos selos | Não verificado | Selos de Manha são vetor por código (`src/art/flat.ts`); não achei cigarro nas 60 chaves vistas no Almanaque, mas não inspecionei cada ícone em zoom | Revisar os 60 ícones de Manha a 32 px |
| H-01 Três art bibles | Resolvido | `docs/visual.md` v2; AGENTS "Visual híbrido"; GDD §1.1 híbrido | — |
| H-02 Cabeçalhos "balatro-style" | Parcial | `BUGS.md` corrigido; **`docs/asset-status.md:3` ainda diz "Branch `balatro-style`"** | GD-016 |
| H-03 `menu-art.ts` com fonte deletada | Resolvido | `src/art/menu-art.ts` não existe | — |
| H-04 GDD §22 contradições | Parcial | Itens 1 e 3 fechados no GDD §22; 2, 4 e 5 abertos | Fechar 4 (precedência) e 5 (pular mesa) |
| H-05 architecture.md desatualizado | Resolvido | `docs/architecture.md` descreve `flat.ts`, `registerPortraits`, companheiros | — |
| H-06 "4 partners" na demo | Resolvido | `grep "4 partners" src/i18n` = 0 (CHANGELOG 0.10.0 fechou) | Site ainda diz "partners with personalities" sem número: ok |
| H-07 Referências a docs inexistentes | Resolvido | `grep asset-keys.md docs/visual.md` = 0 | — |
| C-02 Versionamento / `name` | Regressão parcial | Versão `0.10.0` no esquema de 10 marcos (decisão 2026-10-24); **`package.json` `name` mudou de novo para `zapatro.com` no working tree** (`git diff package.json`), contra D-21 (codinome `truco-roguelite`) | Reverter ou commitar com decisão explícita (GD-028) |
| R-01 99 arquivos sem commit | Resolvido | Working tree só com `package.json` modificado | — |
| R-02 `bun run graph` sem `uvx` | Não resolvido | `uvx: command not found`; `graphify-out/` ausente | Instalar `uv` ou documentar o fallback em `docs/tooling.md` |
| R-03 Parceiros duplicados | Resolvido | `src/data/partners.ts` não existe; `grep PARTNER_IDS\|PARTNERS_DATA\|RIVALS src` = 0 | — |
| R-04 Chaves de save `partner:<id>` | Resolvido | `DEFAULT_UNLOCKS` com 8 `partner:` (`src/data/feats.ts`); `tests/save-compat.test.ts` verde | — |
| R-05 B-01 P0 Electron | Não resolvido | `BUGS.md:19` `[ ]`; não reproduzido aqui | GD-027 |
| R-06 `partner.<id>.name` duplicado | Resolvido | `grep "partner\.[a-zA-Z]*\.name" src/i18n/en.ts` = 0 | — |

### 3.2 Mudanças e critérios de aceite (§4) e pendências (§7)

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Mudança 1 (companheiros sorteados) 4.1.5 | Resolvido | `tests/companions.test.ts`, `tests/companion-styles.test.ts`, `tests/i18n.test.ts` verdes; tela com 3 cartões; Almanaque "Companheiros"; balance PASS | Ajuste fino dos traços ficou para depois (pedido do dev) |
| Mudança 2 (retratos sem PixelLab) 4.2.4 | Resolvido | `scripts/portraits.ts`, `tests/portraits.test.ts`, 20 PNG, `index.json`; Mudo via PixelLab (exceção documentada em `docs/visual.md` §7) | — |
| Mudança 3 (Art Bible v2) 4.3.8 | Resolvido | `docs/visual.md` v2, AGENTS, PLAN §6, GDD §1.1/§13.4/§22, `palette.ts` tokens, `bun run lint:md` 0 issues | `asset-status.md` fora do lote (GD-016) |
| Mudança 4 (sem mexer no site) 4.4 | Parcial | `site/` só recebeu a renomeação e `scripts/site-build.ts` (ícone SVG, `f6cde64`); nenhum deploy novo | O site publicado continua com a identidade antiga (Pixelify Sans, key art pixel de boteco); planejado na seção 7 |
| F0.1b Renumerar 134 tags | N/A | Substituído pela decisão de 2026-10-24: 10 releases `v0.1.0`…`v0.10.0` (`git tag` = 10) | — |
| F0.5 `docs/tooling.md` sobre `uv` | Não verificado | `uvx` ausente na máquina; não li o doc inteiro | Ver R-02 |
| P-03 Fichas azul / Sinal teal | Resolvido | `palette.ts:46,57` | — |
| P-04 Roboto | N/A | Rubik mantido (dev) | — |
| P-05 O Mudo | Resolvido | PixelLab (`art-src/portrait/mudo.png`) | — |
| P-06 Classificação etária (dados, cigarro, cerveja) | Não resolvido | Nenhuma decisão registrada em `docs/decisions.md`; `grep -i "cerveja\|cigarro\|pinga" src/i18n` = 0 (textos limpos) | Inspecionar `sortuda.png`; registrar decisão; questionário IARC (GD-014) |
| P-07 Precedência GDD × PLAN | Não resolvido | GDD §22 item 4 "dev decide"; AGENTS ainda diz "PLAN.md é a fonte da verdade" | Decidir |
| P-08 Pular mesa | Não resolvido | ver G-03 | GD-020 |
| P-09 Manter passivas de nível | Resolvido | `callMult`/`catchBonus`/`bluffChips` em `companions.ts` | — |
| P-10 Verso vermelho com "Z" | Resolvido | Versos vermelhos com Z em toda mesa (`RES-mesa-*.png`) | — |
| P-11 3 feltros | Resolvido | Verde C1–3, azul C5 (`TELA-champ5…`), vermelho C8 (`TELA-champ8…`) | — |
| P-12 8 destravados | Resolvido | 8 `partner:` em `DEFAULT_UNLOCKS` | — |
| P-02b/P-02c (tags remotas, "Latest") | Resolvido | Memória do projeto: 143 releases recriados no GitHub no formato vukem; `v0.10.0` é o atual | — |

**Resumo:** 44 resolvidos · 9 parciais · 7 não resolvidos (G-03/P-08, R-02, R-05/B-01, P-06, P-07, H-04 parte) · 1 regressão parcial (C-02, `name`) · 5 N/A · 4 não verificados (C-06, C-16, F0.5 e a leitura de áudio).

## 4. Achados

Severidade: **Bloqueador** (impede o lançamento) · **Alto** · **Médio** · **Baixo**. Esforço: **P** (até 2 h) · **M** (meio dia) · **G** (1 dia ou mais). Local = arquivo:linha ou tela. Todas as capturas estão em `docs/game-director-evidence/`.

### 4.1 Prontidão comercial (bloqueia a 1.0 comercial, não o jogo)

#### GD-013 · Bloqueador · Steam não configurada e sem material de loja

- **Local:** `desktop/package.json` (`"steamAppId": null`), `desktop/steam/app_build.vdf:2` ("App ID and depot IDs … before the first upload"), `desktop/steam.js:19-21` (sem App ID, `initSteam` retorna e conquistas/Cloud ficam desligados), `.github/workflows/release.yml:68` ("Ad hoc signature (macOS, until a Developer ID is set up)"), `docs/release-checklist.md:24` cita `docs/store-page.md` e `docs/media/`, que não existem (`ls docs/store-page.md docs/media` → "No such file").
- **Reprodução:** `grep steamAppId desktop/package.json`; `ls docs/media`.
- **Impacto:** sem App ID não há página "Em breve", upload SteamPipe, conquistas (37 feitos espelhados, D-28) nem Steam Cloud; sem cápsulas e capturas a página não passa pela revisão da Valve; sem assinatura o `.exe` dispara o SmartScreen.
- **Correção:** executar PLAN RC4.2 (`docs/launch-game.md` §3): App ID, depots, cápsulas (header 920×430, small 462×174, main 616×353, library 600×900, hero 3840×1240, logo), 5+ capturas 1920×1080 do visual híbrido, descrição EN/PT-BR, tags; `steamAppId` no `desktop/package.json`; teste com `STEAM_APP_ID=480`; assinatura de código Windows (certificado ou Azure Trusted Signing) e, se macOS for distribuído, Developer ID.
- **Critério de aceite:** `bun run electron:dev` com Steam aberto imprime `steam: on (app <id>)`; um feito destrava uma conquista visível no overlay; página da loja em "Em breve" há ≥ 2 semanas; `docs/media/` versionado com as artes e `docs/store-page.md` com os textos.
- **Esforço:** G (depende da conta Steamworks).

#### GD-014 · Bloqueador · Licenças, marca e classificação etária em aberto

- **Local:** `CREDITS.md` ("Commercial use depends on paid plans on both platforms (to be confirmed before release, PLAN RC4.5)"); PLAN `Q-01` ("Falta checar marca (INPI/USPTO) e domínio"); P-06 sem decisão em `docs/decisions.md`.
- **Evidência:** busca web por "Zapatro" (2026-10-25) sem jogo homônimo; não consultei bases oficiais. Fontes: Rubik (OFL 1.1, `package.json` `@fontsource/rubik`), Pixelify Sans (OFL, usada só no site e em `src/core/errors.ts:40` como fonte do overlay, não carregada no jogo), Phaser (MIT). Vozes e músicas: ElevenLabs; retratos: conversão local de concept art do ChatGPT + 1 retrato PixelLab.
- **Impacto:** risco jurídico direto na Steam e na Play (takedown por marca ou por uso não licenciado de áudio ou IA); o questionário IARC exige decidir sobre álcool, tabaco e jogo de azar (há cartas, "boteco", "Copo Americano", mas nenhum texto cita bebida, cigarro ou dinheiro real: `grep -i "cerveja|cigarro|pinga|cachaça" src/i18n` = 0).
- **Correção:** confirmar planos comerciais (ElevenLabs Creator ou superior cobre uso comercial; PixelLab conforme ToS) e registrar em `CREDITS.md` com data; busca de marca INPI (classes 9 e 41) e USPTO; decidir P-06 (dados da Sortuda: figa/trevo ou manter); preencher IARC com "sem jogo de azar com dinheiro real".
- **Critério de aceite:** `CREDITS.md` sem "to be confirmed"; `docs/decisions.md` com as três decisões datadas; classificação IARC obtida no Play Console.
- **Esforço:** M (humano).

#### GD-012 · Alto · Trailer ausente no checkout e no site

- **Local:** `trailer/out/` não existe (`ls trailer/out` vazio); `site/src/components/Trailer.tsx:9` renderiza "The trailer is on its way." quando o arquivo falta; o site publicado mostra o placeholder (`GD-012-site-sem-trailer-1920x1080.png`). PLAN RC3.4 marca `[~]` "renderizados (`trailer/out`: trailer 60 s e teaser 15 s, EN e PT) e publicados no site", o que não é o que o site mostra hoje.
- **Impacto:** a página Steam exige ao menos um vídeo; o site perde a principal chamada; o trailer existente (se houver em outra máquina) mostra a UI antiga (revisão anterior §4.4).
- **Correção:** regravar clipes com `bun scripts/record-clips.ts` no visual híbrido, `cd trailer && bun run render`, publicar em `site/public/trailer/` (requisitos na seção 7).
- **Critério de aceite:** `trailer/out/trailer-en.mp4` e `trailer-pt.mp4` existem; `<video>` aparece em <https://truco.lekzera.xyz/>; os clipes mostram a sidebar e o HUD atuais.
- **Esforço:** M.

#### GD-027 · Alto · B-01 (P0) continua aberto e sem reprodução

- **Local:** `BUGS.md:19` e a seção B-01 (`[ ]`): "Cannot read properties of null (reading 'drawImage')" no Electron.
- **Evidência:** não reproduzido em cerca de 230 páginas web desta sessão; não rodei o Electron (limitação).
- **Impacto:** um crash P0 aberto em um build comercial é inaceitável mesmo que raro; o overlay de erro mitiga (continuar, recarregar, baixar o log).
- **Correção:** reproduzir no `Zapatro-0.10.0-win-x64.exe` (minimizar e restaurar, troca de resolução, coringa `newVira`, restart de mesa); guarda em `tilted()` (`src/scenes/TableScene.ts`) que cai para a carta reta quando `f.source.image` é nulo; teste de troca de textura.
- **Critério de aceite:** 30 minutos de soak no Electron (`bun scripts/soak.ts` contra `vite preview` mais sessão manual no `.exe`) sem overlay; item `[x]` no BUGS com commit.
- **Esforço:** M.

#### GD-028 · Médio · `package.json` com `name: zapatro.com` não commitado

- **Local:** `git diff package.json` (`-"name": "truco-roguelite"` / `+"name": "zapatro.com"`). D-21 fixa o codinome `truco-roguelite`; a revisão anterior (C-02) já havia mandado voltar.
- **Impacto:** o `name` entra em `desktop/package.json` (`truco-roguelite`) e nos nomes de artefatos; a divergência confunde a convenção e os scripts de release.
- **Correção:** `git checkout package.json` ou commitar com decisão em `docs/decisions.md`.
- **Critério de aceite:** `git status` limpo; `name` igual em `package.json`, `desktop/package.json` e docs.
- **Esforço:** P.

### 4.2 Gameplay e game design

#### GD-002 · Alto · Partida rápida termina por meta de pontos (110) em uma mão

- **Local:** `src/scenes/TableScene.ts:347` (`goal: tableGoal(params.champ ?? 1, 'small')` para a partida sem run); GDD §11 ("Partida rápida: Truco puro a 12 contra a IA").
- **Reprodução:** Menu → Partida rápida; vença a 1ª mão trucada (ou `?skipMenu=1&seed=3&auto=1`): aparece "Meta batida!" com 212/110 e 3 tentos no placar.
- **Evidência:** `GD-002-partida-rapida-contagem-1280x720.png` (Vaza Limpa 53 × 4 = 212), `GD-002-partida-rapida-meta-batida-1280x720.png`; script de regras: `{"points":2105,"goal":110,"score":{"us":14,"them":7},"hands":4}`.
- **Impacto:** o modo "truco puro" dura de 1 a 4 mãos e quase nunca chega à mão de 11; a tela mostra "Meta" para um modo que não deveria ter meta. É o modo que o brasileiro que "só quer jogar truco" (GDD §1.5) abre primeiro.
- **Correção:** partida rápida sem meta (`goal` indefinido, placar até 12 com 2 quedas ou 1, a decidir) e sidebar com "Tentos NÓS × ELES" no lugar de Meta; ou renomear o modo para "Mesa avulsa" e documentar no GDD. Recomendo a primeira.
- **Critério de aceite:** `?skipMenu=1&seed=1&auto=1&speed=4` só termina com `score.us >= 12` ou `score.them >= 12`; `qa.ts` grupo `end` ajustado; GDD §11 e a página 12 das Regras coerentes.
- **Esforço:** P/M.

#### GD-003 · Médio · A regra do chefe não aparece na mesa do chefe

- **Local:** `src/scenes/TableScene.ts` não desenha `boss.<id>.rule` (só o nome, linha 559); a regra só aparece na seleção (`src/scenes/RunScene.ts`, `drawSelect`).
- **Evidência:** `GD-003-selecao-chefe-com-regra-1280x720.png` (regra visível) contra `GD-003-mesa-chefe-sem-regra-1280x720.png` (nada na mesa; só o nome em vermelho).
- **Impacto:** regras como "a Fama conta em dobro" ou "a Manha mais à esquerda fica desativada" mudam a decisão de toda mão; o jogador tem de decorar. O Balatro mostra o Boss Blind o tempo todo.
- **Correção:** linha de regra no cartão do chefe (sob o nome) ou no cartão "Campeonato · Mesa" da sidebar ("Mesa do Chefe · O Professor: Fama em dobro"), com tooltip.
- **Critério de aceite:** com `?skipMenu=1&boss=professor` a regra aparece em PT-BR e EN sem sobrepor outro texto a 1280×720 e 1366×768.
- **Esforço:** P.

#### GD-020 · Médio · Pular mesa continua dominante e sem decisão

- **Local:** GDD §5.3 (+8 a +20 p.p.), `src/game/run-sim.ts:76-84` (o bot não pula "para não esconder o problema"), `docs/decisions.md` (pendente desde 2026-10-01), revisão anterior P-08.
- **Impacto:** jogadores que descobrem o truque pulam Pequena e Grande e chegam ao chefe com Promessas; a run perde tensão de economia.
- **Correção (proposta mínima da revisão anterior):** a Promessa só é resgatada se a mesa seguinte for vencida; alternativa: pular aumenta a meta da próxima mesa em 15 %.
- **Critério de aceite:** `bun scripts/sim.ts` com `HABITS.skip` ligado fica em até +5 p.p. sobre o bot sem pular; registrado em `docs/balancing.md`.
- **Esforço:** M.

#### GD-021 · Baixo · Estacas sem medição com o elenco novo

- **Local:** `docs/balancing.md` (degraus de 2026-10-01, antes dos companheiros); `scripts/stakes.ts` não rodado nesta sessão.
- **Evidência:** 2 runs do bot na Estaca 8: 1 vitória (seed 31, C8) e 1 derrota (seed 32, C5). Amostra insuficiente; D-39 espera −5 a −8 p.p. por degrau (Estaca 8 em torno de 5–15 % de vitória).
- **Correção:** `bun scripts/stakes.ts` e tabela nova em `docs/balancing.md`.
- **Critério de aceite:** degraus dentro de −5 a −8 p.p.; Estaca 8 ≤ 15 %.
- **Esforço:** P (tempo de CPU).

#### GD-022 · Baixo · Regras verificadas no jogo (registro)

Saída do script de regras (`?skipMenu=1`, seeds 3 e 1):

```text
PASS 1st trick: Esconder disabled (trick index 0)
PASS folding the mão de 11: rivals get exactly 1 tento — {"over":{"winner":"them","tentos":1,"reason":"elevenFold"}}
PASS T raises the bet (rivals ran): we gain the previous value (1) — before 0-0, after 1-0
PASS no truco button in the mão de 11
PASS 11×11 deals the iron hand · no truco · no signal · own cards face down
PASS vira 4 → "Manilha: 5 · ZAP: 6♣" (ZAP banner on screen: GD-011-zap-selo-1280x720.png)
PASS signalsLeft starts at 1; after one signal the Sinal button is disabled
PASS rapid key presses play exactly one card per turn (before=3 after=2)
```

Não observado na UI (só por código e teste): encoberta liberada a partir da 2ª vaza (`src/logic/truco/table.ts:295`, `canCover = s.tricks.length >= 2`, coberto por `tests/truco.test.ts`); o script não conseguiu capturar um turno humano na 2ª vaza antes de a mão acabar a 4×. A regra "a mesma dupla não pede duas vezes seguidas" (PLAN §5.7) idem: os rivais correram nas duas tentativas.

### 4.3 UI e UX

#### GD-001 · Alto · Pacote de Baralho (4 opções) corta a 1ª e a 4ª carta

- **Local:** `src/scenes/RunScene.ts:1217` (`setPosition(cx + (i - (options.length - 1) / 2) * 175, 172)` com cartões `w: 166`): 4 opções ocupam 3 × 175 + 166 = 691 px num palco de 640.
- **Reprodução:** loja → Pacote de Baralho ($4, 4 opções) → tela "Escolha 1".
- **Evidência:** `GD-001-pack-4-opcoes-cortado-1280x720.png` e `-1920x1080.png` (texto "…ma carta comum para o seu baralho" cortado dos dois lados; o botão "Escolher" da 1ª carta sai da tela).
- **Impacto:** acontece em toda loja da run (o pacote de baralho é o mais barato); o jogador não lê a 1ª nem a 4ª opção e pode não achar o botão. É o defeito visual mais frequente do jogo.
- **Correção:** passo de 150 px e cartão de 144 px para 4 opções (4 × 150 = 600), ou duas linhas, ou rolagem; manter 166/175 para 3 opções.
- **Critério de aceite:** com `g.scene.keys.Run.run.shop.opened` de 4 itens, `getBounds()` de todos os cartões fica dentro de `[0, 640]`; captura a 1280×720 e 1366×768; `qa.ts` grupo `pack` com 4 opções.
- **Esforço:** P.

#### GD-005 · Médio · Moldura do tutorial (passo 3) une a sidebar ao HUD oposto

- **Local:** `src/scenes/TableScene.ts:428-429` (`case 'score': return union([this.scoreText, this.quedasText, this.betText])`): `scoreText` e `betText` estão na sidebar esquerda e `quedasText` no bloco HUD do canto superior direito; a união vira um retângulo de 1.140 × 360 px.
- **Evidência:** `GD-005-tutorial-passo3-moldura-1280x720.png` (moldura amarela da Meta até o HUD, cobrindo o feltro inteiro).
- **Impacto:** o passo "Placar e aposta", que ensina a regra central das quedas, aponta para "tudo"; o jogador novo não entende para onde olhar.
- **Correção:** anchor `score` = sidebar (Meta, Aposta, Tentos deles) e um passo separado ou um segundo destaque para o HUD (tentos NÓS e quedas); ou dois retângulos.
- **Critério de aceite:** no passo 3 a moldura cobre só a sidebar (largura ≤ 140 px lógicos) ou dois retângulos separados; captura a 1280×720.
- **Esforço:** P.

#### GD-006 · Médio · Fim de run quase vazio e com plural errado

- **Local:** `src/scenes/RunScene.ts:1237` (`drawEnd`); `src/i18n/pt-BR.ts:268` (`'{h} mãos'` com `{h}` = 1 → "1 mãos").
- **Evidência:** `GD-006-fim-de-run-1280x720.png` ("A run acabou · Campeonato 1 · 0 mesas vencidas · 1 mãos · melhor mão 0"), `GD-006-fim-de-run-vitoria-1280x720.png`.
- **Impacto:** o momento de fechamento não mostra parceiro, Manhas da build, dinheiro final, feitos destravados nem o chefe que derrotou o jogador; é o painel que mais vira captura compartilhada em roguelites.
- **Correção:** resumo com retrato do parceiro, Manhas em miniatura, Lance mais alto, $ final, feitos novos (já existem toasts), causa da derrota; plural condicional (`{h} mão|mãos`) em EN e PT-BR.
- **Critério de aceite:** painel com ≥ 5 dados da run; "1 mão" no singular; sem texto fora do painel a 1280×720.
- **Esforço:** M.

#### GD-009 · Baixo · Selo "Esc" do botão de pausa fica fora da sidebar, colado na borda inferior

- **Local:** sidebar da mesa (`src/scenes/TableScene.ts`, barra inferior de 3 botões); o selo é desenhado sob o botão, fora do cartão.
- **Evidência:** `GD-004-sidebar-sem-truco-1280x720.png` (selo "Esc" em y ≈ 710/720), `GD-009-esc-borda-3440x1440.png` (mesmo a 3440×1440 o selo encosta na borda).
- **Impacto:** em 16:9 o selo fica a 2 px da borda da janela; em monitores com overscan ou barra de tarefas sobreposta ele some.
- **Correção:** selo à direita do botão (como nos botões de ação) ou dentro do cartão.
- **Esforço:** P.

#### GD-010 · Baixo · Linha de dicas do rodapé sobrepõe a borda inferior dos painéis

- **Local:** Configurações e Controles (`src/scenes/SettingsScene.ts`, `src/scenes/KeybindsScene.ts`), texto de dicas em y ≈ 698/720.
- **Evidência:** `GD-010-configuracoes-dica-rodape-1280x720.png`, `GD-010-controles-dica-rodape-1280x720.png` (a dica "↑↓ escolher · ←→ mudar…" cruza a borda dos três painéis).
- **Correção:** reservar 14 px lógicos abaixo dos painéis ou mover a dica para dentro do painel direito.
- **Esforço:** P.

#### GD-023 · Baixo · Almanaque abre com o foco no botão fechar

- **Local:** `src/scenes/AlmanacScene.ts:132` (botão "✕" com selo "Enter").
- **Evidência:** `TELA-almanac-1280x720.png`: o selo "Enter" está no ✕, não na primeira Manha.
- **Impacto:** Enter ao abrir fecha a tela; no controle o primeiro ✕ sai do Almanaque.
- **Correção:** foco inicial na primeira aba ou no primeiro ícone.
- **Esforço:** P.

#### GD-024 · Baixo · Ultrawide mostra só barras neutras

- **Evidência:** `RES-mesa-3440x1440.png`, `RES-mesa-2560x1080.png`, `RES-menu-3440x1440.png` (palco 16:9 centralizado, 440 px de cinza `#2B2B2B` de cada lado).
- **Impacto:** não é defeito (o fundo neutro é a identidade), mas `docs/steam-monitor-resolution-market-research.md` promete "mostra mais mundo nas laterais (853–860 lógicos)". Alinhar o doc ou esticar o feltro.
- **Esforço:** P (doc) ou M (feltro largo).

### 4.4 Texto e localização

#### GD-004 · Médio · Strings proibidas pela Art Bible ("sem truco") em 5 textos PT-BR

- **Local:** `src/i18n/pt-BR.ts:159` (`'table.side.noCall': 'sem truco'`, cartão Aposta de toda mesa), `:126` (`table.iron`), `:356-357` (`manha.rendaExtra.desc/why`), `:744` (`tutorial.eleven.body`). `docs/visual.md` §5 lista `sem truco` entre as strings proibidas; `tests/vocabulary.test.ts:5-16` não inclui `sem truco`.
- **Evidência:** `GD-004-sidebar-sem-truco-1280x720.png` ("Aposta 1 sem truco"); saída do audit: `BANNED pt table.side.noCall: "sem truco"`.
- **Impacto:** decisão do diretor (D1) de afastar o vocabulário do jogo Malandro; a string mais visível do HUD contradiz a própria Art Bible.
- **Correção:** "Aposta 1 · normal", "1 tento" ou "sem aposta"; "MÃO DE FERRO · às cegas, sem aposta"; Renda Extra "+$1 ao vencer uma mão sem aposta"; incluir `/\bsem truco\b/i` no teste.
- **Critério de aceite:** `tests/vocabulary.test.ts` com a string nova e verde; `grep -rn "sem truco" src/i18n` = 0.
- **Esforço:** P.

#### GD-007 · Baixo · Gênero fixo nos estilos dos companheiros (PT-BR) e "ele(a)"

- **Local:** `src/i18n/pt-BR.ts:529` (`'partner.style.cautious': 'Conservadora: …'`, usado por Zé, Joca, Tião, Neide e Dona Cida: `src/data/companions.ts` tem `style: 'cautious'` em 5 ids), `:530` (`'Blefador'` para Lurdes e Zé Malandro), `:234` (`'run.pick': 'Jogar com ele(a)'`).
- **Evidência:** `GD-007-parceiro-genero-1280x720.png` ("Zé — Conservadora", "Lurdes — Blefador").
- **Correção:** estilo sem gênero ("Estilo cauteloso: …", "Blefa: …") ou textos por companheiro (`companion.<id>.style`); "Jogar com {nome}".
- **Critério de aceite:** nenhum cartão com adjetivo em gênero errado nos 10 companheiros; `run.pick` com o nome.
- **Esforço:** P.

#### GD-008 · Baixo · Inglês com mistura de glossário ("Quedas 0 / theirs", "Their tentos")

- **Local:** `src/i18n/en.ts:162` (`'table.hud.quedas': 'Quedas {us} / theirs'`), `table.side.theirs` ("Their tentos").
- **Evidência:** `GD-008-mesa-en-quedas-theirs-1280x720.png`.
- **Correção:** "Quedas: us {us} · them {them}" ou "Falls {us} · theirs {them}"; manter "tentos" como glossário é aceitável, mas a mistura "Quedas … theirs" lê mal.
- **Esforço:** P.

#### GD-025 · Baixo · Outros textos (audit heurístico de 815 chaves)

- `src/i18n/pt-BR.ts:268` "{h} mãos" (plural fixo; ver GD-006).
- `src/i18n/en.ts`: 24 nomes de Manha em português sem tradução nem tooltip de significado (ex.: "Mão de Lixo", "Pé-Quente", "Caixa de Fósforo"); a decisão D-29 mantém os nomes em PT; recomendo uma linha "lit.: Trash Hand" na descrição EN do Almanaque para o público internacional.
- `src/i18n/en.ts`: `tutorial.rivals.body` e `companion.trait.catch` usam "His pair" para companheiras (Lurdes, Neide, Bia, Dona Cida): "their pair".
- Nenhuma chave crua, placeholder ou TODO; placeholders `{}` iguais nas duas línguas em 815/815 chaves (script `audit-i18n.ts` desta sessão).

### 4.5 Arte e Art Bible

#### GD-011 · Médio · Manilha e ZAP não seguem a especificação da Art Bible §6

- **Local:** `docs/visual.md` §6: "Manilha e ZAP: face normal + borda dourada de 2 px + placa dourada no rodapé ('ZAP' para paus, ★ para as outras manilhas)". Implementação (`src/art/flat.ts`): ZAP com ★ no canto superior direito e faíscas; manilha só com borda dourada, sem placa.
- **Evidência:** `GD-011-zap-selo-1280x720.png` (6♣ com ★ no canto; 5♠ manilha só com borda).
- **Impacto:** a manilha comum não se distingue de uma carta destacada por foco em modo 4 cores ou com daltonismo (regra "nada só por cor": a borda dourada é a única marca).
- **Correção:** placa "ZAP"/★ no rodapé como na bible, ou atualizar a bible para "★ no canto do ZAP, borda na manilha" e acrescentar um glifo pequeno na manilha.
- **Critério de aceite:** manilha reconhecível sem cor (teste com a tela em escala de cinza); `docs/visual.md` §6 e `flat.ts` coerentes.
- **Esforço:** P.

#### GD-026 · Baixo · Fundo do retrato por personagem, não por papel (ver C-12 na seção 3)

- **Local:** `src/art/flat.ts:1176` (`portraitBg(id)`), `docs/visual.md` §7.
- **Correção:** decidir e documentar; se por papel, pintar parceiro em verde-feltro claro, rivais em vermelho e chefe em vinho (proposta da revisão anterior).
- **Esforço:** P.

### 4.6 Áudio

#### GD-017 · Médio · Orçamento web acima do limite do Poki e um take faltando

- **Local:** `public/assets/audio` = 8,5 MB (`du -sh`), limite Poki 8 MB (PLAN §9, `docs/audio.md` "Orçamento web"); `vo.juninho.oloco` tem 1 take contra 2 dos demais.
- **Impacto:** o build Poki depende de `VITE_POKI=1` remover vozes e ambiências tardias (D-61); a regra "sob demanda do que não é do Campeonato 1" não existe no `BootScene` (carrega tudo que está em `public/assets/audio` via `__ASSET_FILES__`).
- **Correção:** carregamento sob demanda por Campeonato (ambiências, `music.king`, vozes dos chefes) no `BootScene`/`music.ts`; gerar `vo.juninho.oloco.2` ou aceitar 1 take.
- **Critério de aceite:** download inicial do `/play/` < 8 MB (DevTools, rede); build Poki < 8 MB.
- **Esforço:** M.

#### GD-018 · Baixo · Mixagem e loops não auditados (limitação)

`docs/audio.md` registra LUFS por categoria (−16/−20/−18/−30) e crossfade de loop para músicas ≥ 30 s; `sfx.ui.error` bruto a −26 LUFS "ok depois de normalizado". Sem escuta nesta sessão: não verificado. Recomendo um passe de escuta de 15 minutos (menu → mesa → truco → contagem → loja → chefe) antes da 1.0, conferindo que "Mudo (tudo)" silencia a ambiência e que a perda de foco não deixa a música tocando (Phaser `pauseOnBlur: true` confirmado por consulta ao vivo).

### 4.7 Estabilidade e técnica

#### GD-029 · Baixo · Registro de robustez (tudo PASS)

```text
PASS corrupt main save → recovered from .bak (run still there) and quarantined — keys: save, save.corrupt.<ts>, save.bak
PASS the menu tells the player the save was restored (ROB-save-recuperado-1280x720.png)
PASS future-version save stays untouched after boot · the game boots from the backup with a notice
PASS resize to 800x600 / 2560x1080 / 1280x800 / 640x360 / 1920x1080 keeps the table alive (zoom 1.25/3/2/1/3) — ROB-resize-*.png
PASS reload in the middle of a hand re-deals the same 3 cards (qa.ts, grupos save e continue)
PASS sound manager: pauseOnBlur=true, context running
PASS no console errors in robustness session
```

#### GD-030 · Baixo · Heap cresce cerca de 30 MB por run (não classificado como vazamento)

- **Evidência:** runs 11, 12 e 13: 58→80, 51→83, 56→84 MB em 3–8 min a 4×; demo (59 s): 55→63 MB.
- **Correção:** rodar `bun scripts/soak.ts --url http://localhost:5191` (30 runs) e olhar a tendência pós-GC antes da 1.0.
- **Esforço:** P (tempo de máquina).

### 4.8 Documentação (GDD, Art Bible, PLAN)

#### GD-015 · Médio · GDD desatualizado em 5 pontos

| GDD | Diz | Jogo | Correção |
|---|---|---|---|
| §9 (linha 454) | "Retrato grande `boss.<id>` (96×96)" | retratos 128×128 (`public/assets/gfx/portrait/`) | 128×128 |
| §11 | Partida rápida "Truco puro a 12" | termina pela meta 110 (GD-002) | corrigir o jogo e manter o GDD |
| §12 (linha 543) | Controles, Pausa, Próximas mesas, Regras "pendente" | todas implementadas no híbrido (`TELA-controls…`, `TELA-pause…`, `TELA-select…`, `TELA-rules…`) | "concept aplicado" |
| §13.2 (linha 563) | HUD antigo: "Topo: Manhas e dinheiro · … painel 'Jogadas' · coluna de resposta" | sidebar de 6 cartões + bloco HUD (Art Bible §5) | reescrever |
| §14 (linha 605) | "`caiu` e `oloco` sem gatilho" | `src/scenes/TableScene.ts:1465-1466` toca os dois | remover da pendência |

#### GD-016 · Médio · Sobras do template e cabeçalhos errados em docs e CI

- `docs/release-checklist.md:11`: "`bun scripts/perf.ts`: orçamento da §9 (≥ 58 FPS com 150 monstros)" — herança do Gridbound; `scripts/perf.ts` não existe (`ls scripts`).
- `docs/release-checklist.md:24`: cita `docs/store-page.md` e `docs/media/`, inexistentes.
- `docs/asset-status.md:3`: "Branch `balatro-style`: n/a nesta branch"; o relatório inteiro (476/476) é da linha pixel art.
- `.github/workflows/release.yml:26`: "Demo build (championships 1-2 …)" — a demo é o Campeonato 1 (D-33 revista).
- `AGENTS.md` contra o cabeçalho do GDD: "PLAN é a fonte da verdade" contra "GDD > PLAN" (P-07).
- `docs/steam-monitor-resolution-market-research.md`: "ultrawide mostra mais mundo" (GD-024).

### 4.9 Site (achados; o plano está na seção 7)

#### GD-019 · Médio · Site com a identidade antiga e links "em breve"

- **Local:** `site/src/components/Shell.tsx:11-16` (Pixelify Sans), `site/src/i18n.ts:6-7` ("in a pixel-art boteco"), key art `/img/keyart.jpg` (cena de boteco em pixel art), `site/src/links.ts` (todos `null`), `press.release.value` "In development (beta)".
- **Evidência:** `GD-012-site-sem-trailer-1920x1080.png`, `GD-019-site-mobile-390x844.png`; metadados coletados: title "Zapatro: a Truco Paulista roguelite", og:image `/img/keyart.jpg`, favicon `/img/icon-64.png`, `lang` en, altura de rolagem 1080 = uma tela.
- **Impacto:** o site vende um jogo que não é o que está em `/play/` (fonte, paleta e cena contradizem a Art Bible v2); sem link de loja não converte.
- **Correção:** seção 7.

## 5. Matriz de resoluções

Método: 10 telas (menu, Configurações, mesa, truco, balcão, parceiro, seleção, contagem, Almanaque, Regras) em cada combinação, com heurística de sobreposição de textos (≥ 50 % de interseção entre dois objetos `Text` visíveis) e de texto fora da câmera. Capturas `RES-mesa-<res>.png` e `RES-balcao-<res>.png` para todas; `RES-menu-3440x1440.png`, `RES-selecao-2560x1600.png`, `RES-parceiro-1366x768.png`.

| Resolução | Share Steam ago/2026 | Zoom → área lógica | Resultado | Problemas |
|---|---|---|---|---|
| 1920×1080 | 50,52 % | ×3 → 640×360 | OK | GD-009 (selo Esc na borda) |
| 2560×1440 | 21,86 % | ×4 → 640×360 | OK | GD-009 |
| 2560×1600 | 5,71 % | ×4 → 640×400 | OK | margens superior e inferior de 20 px lógicos, centralizado |
| 3840×2160 | 4,98 % | ×6 → 640×360 | OK | pixel art dos retratos nítida (múltiplo inteiro) |
| 3440×1440 | 3,14 % | ×4 → 640×360 + barras | OK | GD-024 (barras neutras de 440 px) |
| 1920×1200 | 2,76 % | ×3 → 640×400 | OK | — |
| 1366×768 | 2,23 % | ×2 → 683×384 | OK | texto pequeno da sidebar (10–11 px físicos) no limite de leitura |
| 1440×900 | 0,73 % | ×2 → 720×450 | OK | — |
| 1600×900 | 0,67 % | ×2 → 800×450 | OK | — |
| 2560×1080 | 0,67 % | ×3 → 853×360 | OK | GD-024 |
| 1280×800 (Steam Deck) | 0,31 % | ×2 → 640×400 | OK | texto da sidebar a 11 px físicos; conferir a 30 cm no aparelho |
| 1280×720 | — | ×2 → 640×360 | OK | GD-009, GD-010 |
| 1536×864 | — | ×2 → 768×432 | OK | — |
| 1920×1080 @2× (Retina) | — | ×3 CSS / ×6 físico | OK | — |
| 1366×768 @1,25× (notebook Windows) | — | ×2 | OK | — |
| 1280×720 @1,5× | — | ×2 | OK | — |

Totais: 160 capturas, 0 sobreposições de texto, 0 textos fora da câmera, 0 erros de console, 0 falhas de rede; 3 timeouts por contenção de CPU (3 browsers simultâneos) refeitos com sucesso. Modo janela × tela cheia: o Electron abre a 1280×720 (mín. 960×540, `desktop/main.js:36-40`); tela cheia não acionada (limitação). Resize ao vivo durante a mão: 5 tamanhos sem erro (`ROB-resize-*.png`).

## 6. Pontos fortes (preservar)

1. **Regras do Truco Paulista corretas e legíveis:** vira/manilha/ZAP com rótulo ("Manilha: K · ZAP: A♣"), mão de 11 com as cartas do parceiro abertas, mão de ferro às cegas, encoberta, correr pelo valor anterior; tudo bate com PLAN §5 nos testes jogados.
2. **Arquitetura por eventos e turnos:** lógica pura sem Phaser, `legalActions`/`apply`, IA só por `observe`; permitiu 6 runs do bot no jogo real e 268 testes sem um flake.
3. **Save à prova de bala:** `.tmp` → valida → `.bak` → promove, quarentena, versão futura intocada, aviso no menu; recarregar no meio da mão volta às mesmas 3 cartas.
4. **Atalhos sempre visíveis:** selos de tecla em todo botão, foco inicial no teclado e no controle (`qa.ts` grupo `deck` com pad falso PASS).
5. **Layout híbrido limpo e escalável:** zoom inteiro pela altura, 16 combinações sem quebra; retratos 128 px nítidos; sidebar e HUD legíveis.
6. **Conteúdo e Almanaque:** 60 Manhas, 10 chefes, 10 companheiros com perk/flaw expostos na escolha e no tooltip do rival (intenção à la Slay the Spire), 5 baralhos, 8 Estacas.
7. **Localização completa:** 815 chaves EN e PT-BR sincronizadas pelo tipo; testes de i18n e de vocabulário.
8. **Pipeline de release reproduzível:** gates em hook, CHANGELOG Keep a Changelog, `.exe` portátil por release, CI com smoke Electron e APK.
9. **Tutorial jogado de 14 passos** com destaque de elementos e pulo a qualquer momento.
10. **Política de privacidade** simples e verdadeira (sem telemetria, D-31), já publicada em EN e PT-BR.

## 7. Especificação do novo site (zapatro.com)

### 7.1 Estrutura atual (documentada em 2026-10-25, <https://truco.lekzera.xyz/>)

Medido com Playwright a 1920×1080 (`GD-012-site-sem-trailer-1920x1080.png`), 1366×768 e 390×844 (`GD-019-site-mobile-390x844.png`); código em `site/src/components/Pages.tsx` (`Home`), `Shell.tsx`, `Trailer.tsx`, `i18n.ts`, `links.ts`.

- **Viewport:** uma tela só no desktop (altura de rolagem = 1080 = `innerHeight`), `min-h-dvh`, `flex-col`: header (56 px) · `main` que ocupa o resto (`flex-1 items-center`) · footer (60 px).
- **Header:** logo (ícone 32 px + "Zapatro") à esquerda em x 160; à direita "Press kit" e o seletor de idioma (English ▾ / Português).
- **Hero em duas colunas** (`grid md:grid-cols-2 gap-8`, container 10/12 colunas): **esquerda** h1 "Zapatro" (784×90 px em x 160, y 348), tagline em dourado, pitch, CTA laranja "PLAY NOW" (226×72, `/play/`, nova guia) + "Play the demo" (189×56, `/demo/`), linha de apoio "The full game in your browser…"; **direita** o trailer (`<video controls preload="none" poster=/img/keyart-1280.webp>` quando `public/trailer/trailer-<lang>.mp4` existe; senão um quadro 16:9 com a key art e "The trailer is on its way.") a partir de x 980, 780×440.
- **Fundo:** key art 1920×1080 em pixel art (cena de boteco) com `brightness(0.3)`, cobrindo o `main`.
- **Footer:** badges "Steam · Google Play · itch.io · Discord · Contact" (todos "coming soon", `links.ts` = `null`), "Privacy", crédito "Made by Alex Galhardo. Pixel art with PixelLab, audio with ElevenLabs."
- **Responsivo:** abaixo de `md` (768 px) vira uma coluna: texto, CTAs, depois o trailer; o footer quebra em linhas; a página passa a rolar (mobile 390 px: 2274 px de altura).
- **Rotas:** `/` e `/pt/` (home), `/presskit/` e `/pt/presskit/` (ficha técnica, descrição, história, destaques, capturas `/img/shots/{table,count,shop,select,rules,menu}.webp`, logo e ícone, zip), `/privacy/` e `/pt/privacy/`, `/play/` e `/demo/` (builds gerados por `scripts/site-build.ts`).
- **Metadados hoje:** title "Zapatro: a Truco Paulista roguelite"; description "…in a pixel-art boteco…"; og:image `/img/keyart.jpg`; `twitter:card summary_large_image`; `alternates.languages` en / pt-BR; favicon `/img/icon-64.png`; `metadataBase` = `SITE_URL` ou `https://truco.lekzera.xyz`; tipografia Pixelify Sans (Google Fonts via `next/font`); cor `#14100d`.

### 7.2 Sitemap do zapatro.com

```text
zapatro.com/                 home EN (uma tela, trailer à direita)
zapatro.com/pt/              home PT-BR
zapatro.com/presskit/        + /pt/presskit/
zapatro.com/privacy/         + /pt/privacy/
zapatro.com/play/            jogo completo (build web)
zapatro.com/demo/            demo (Campeonato 1)
zapatro.com/sitemap.xml      gerado no build (next-sitemap ou script)
zapatro.com/robots.txt       allow all; Sitemap: https://zapatro.com/sitemap.xml
truco.lekzera.xyz/*  →  301 → zapatro.com/*   (mesmo caminho, inclusive /play/ e /demo/)
zapaco.vercel.app/*  →  301 → zapatro.com/*   (já redireciona para truco.lekzera.xyz; encadear)
```

### 7.3 Wireframe (mesma estrutura, trailer à direita)

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ [♣ Zapatro]                                        [Press kit] [EN ▾]  (56 px) │
├────────────────────────────────────────────────────────────────────────────────┤
│  fundo #2B2B2B chapado + leque de 3 cartas vetoriais em marca-d'água (sem cena)│
│                                                                                │
│  ZAPATRO  (Rubik 700, dourado #F4C542, sombra sólida #1A1A1A 4 px)             │
│  A Truco Paulista Roguelite. Pede. Aumenta. Monta.      (tagline, creme)       │
│  Você e seu parceiro contra dois rivais … (pitch, 3 linhas máx.)               │
│                                                                                │
│  [ JOGAR AGORA  ▸ Enter ]  [ Jogar a demo ]   ← selos de tecla como no jogo    │
│  Jogo completo no navegador ou demo até o 1º chefe · mouse, teclado,           │
│  toque e controle.                                                             │
│                                                                                │
│  [Steam ↗] [Google Play ↗] [itch.io ↗]   (badges reais; "em breve" até o link) │
│                                                         ┌────────────────────┐ │
│                                                         │   TRAILER 16:9     │ │
│                                                         │  poster = frame da │ │
│                                                         │  contagem Fichas×  │ │
│                                                         │  Mult; botão play  │ │
│                                                         │  ▶ no centro       │ │
│                                                         └────────────────────┘ │
│                                                         EN | PT-BR (legendas)  │
├────────────────────────────────────────────────────────────────────────────────┤
│ Steam · Google Play · itch.io · Discord · Contato · Privacidade      © 2026   │
│ Feito por Alex Galhardo · Retratos em pixel art · Áudio com ElevenLabs (60 px) │
└────────────────────────────────────────────────────────────────────────────────┘
```

Regras: o hero continua em `grid md:grid-cols-2`; coluna esquerda com largura máxima de 36 rem; o `<video>` à direita ocupa 100 % da coluna com `aspect-video`, borda 2 px `#231C17`, raio 8 px e sombra sólida 4 px (mesma linguagem dos painéis do jogo). No móvel (< 768 px) a ordem passa a: título, tagline, CTA, trailer, pitch, badges. Nada de cena de boteco, gradiente ou textura (Art Bible v2 §1).

### 7.4 Tokens de design aplicados ao site

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#2B2B2B` (`PALETTE.bgNeutral`) | fundo da página |
| `--panel` / `--panel-dark` | `#30261F` / `#231C17` | header, footer, cartões, moldura do vídeo |
| `--gold` | `#F4C542` | título, foco, links em hover |
| `--cream` / `--text` | `#F8F0DE` / `#F6EEDC` | texto |
| `--chips` / `--mult` | `#3F7FC0` / `#E4572E` | destaques "Fichas × Mult" no pitch |
| `--cta` | `#47B468` (`good`) | JOGAR AGORA (verde, como "Jogar" no jogo); hover `#3A9B57` |
| `--danger` | `#D2392F` | nada no site além de erros |
| `--felt` | `#24644D` | fundo opcional da área do trailer |
| Tipografia | Rubik 400/500/700 (`next/font/google`, `display: swap`); h1 `clamp(2.6rem, 5vw, 5rem)`; tagline 1.5 rem; corpo 1.125 rem; linha 1.5 | troca Pixelify Sans → Rubik (única fonte, Art Bible §4) |
| Espaço | escala de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 | padding dos botões 16×32; gap do grid 32 |
| Raio | 8 px painéis e vídeo; 6 px botões; 4 px selos | igual ao jogo |
| Sombra | sólida, `0 4px 0 #1A1A1A` (sem blur) | botões, cartões, vídeo |
| Foco | contorno 3 px `#F4C542` + offset 2 px | teclado |
| Movimento | 150 ms `ease-out` em hover/foco; respeitar `prefers-reduced-motion` | — |

### 7.5 Textos principais

| Chave | EN | PT-BR |
|---|---|---|
| headline | Zapatro | Zapatro |
| tagline | A Truco Paulista Roguelite. Call it. Raise it. Build it. | Um roguelite de Truco Paulista. Pede. Aumenta. Monta. |
| pitch | You and your partner against two rivals. Every hand you win scores Chips × Mult, and calling TRUCO multiplies it. Between tables, build an absurd engine of Manhas, upgraded cards and Simpatias, then beat 8 Championships and the Rei do Truco. | Você e seu parceiro contra dois rivais. Toda mão vencida pontua Fichas × Mult, e pedir TRUCO multiplica. Entre as mesas, monte um motor absurdo de Manhas, cartas melhoradas e Simpatias e vença 8 Campeonatos até o Rei do Truco. |
| CTA 1 | Play now | Jogar agora |
| CTA 2 | Play the demo | Jogar a demo |
| apoio | The full game in your browser, or a demo up to the first boss. Mouse, keyboard, touch and gamepad. | Jogo completo no navegador ou demo até o primeiro chefe. Mouse, teclado, toque e controle. |
| badges | Wishlist on Steam · Google Play · itch.io | Lista de desejos na Steam · Google Play · itch.io |
| meta description | Zapatro is a Truco Paulista roguelite: 2v2 truco where the bet is your multiplier. Build Manhas, bluff with signals, beat 8 Championships. Steam, Google Play and a free web demo. | Zapatro é um roguelite de Truco Paulista: truco 2×2 em que a aposta é o seu multiplicador. Monte Manhas, blefe com sinais, vença 8 Campeonatos. Steam, Google Play e demo grátis na web. |

Remover do site: "pixel-art boteco" (descrição), "Pixel art with PixelLab" no crédito (os retratos vêm de concept art convertida; manter "Retratos em pixel art").

### 7.6 Requisitos do trailer

- Duração 60 s (versão completa) + corte de 15 s (anúncios/Steam Next Fest), EN e PT-BR (texto na tela e legendas `.vtt`), 1920×1080 a 60 fps, H.264 (MP4, ~8–10 Mbps) para a Steam e para o site; versão WebM VP9 opcional para o site.
- Estrutura: 0–5 s título + "TRUCO!" com som; 5–25 s mão completa (sinal do parceiro, truco aceito, contagem Fichas × Mult subindo); 25–40 s loja e build (Manhas, pacote, Melhoria); 40–52 s chefe com regra na tela; 52–60 s logo + "Steam · Google Play · demo grátis" + URL.
- No site: `<video controls preload="metadata" playsinline poster="/img/trailer-poster.webp">` com `<track kind="subtitles" srclang="en|pt-BR">`; sem autoplay com som; fallback = poster + botão "Assistir no YouTube"; tamanho alvo ≤ 12 MB (60 s a 1,5 Mbps para o web; o arquivo 1080p/60 completo fica na Steam e no YouTube).
- Clipes gravados do visual híbrido atual (`bun scripts/record-clips.ts`), nunca da UI antiga.

### 7.7 SEO e metadados

- `<title>` home: "Zapatro — A Truco Paulista Roguelite" (EN) / "Zapatro — Roguelite de Truco Paulista" (PT); demais páginas "Press kit · Zapatro" etc. (já é assim).
- `description` conforme 7.5; `canonical` por idioma; `hreflang` en, pt-BR e `x-default` → en; `lang` correto em cada árvore (já é).
- Open Graph e Twitter: `og:type website`, `og:site_name Zapatro`, `og:image` 1200×630 novo (logo dourado sobre `#2B2B2B` + leque de cartas + "Fichas × Mult"), `og:image:alt`, `twitter:card summary_large_image`.
- Favicon: `favicon.svg` (ícone do app, `art-src/app-icon.svg`) + `favicon.ico` 32/48 + `apple-touch-icon.png` 180 + `icon-192/512.png` (manifest).
- JSON-LD `VideoGame` (name, genre "Roguelike card game", gamePlatform, inLanguage en/pt-BR, author, offers quando houver preço) e `VideoObject` do trailer.
- `sitemap.xml` e `robots.txt`; `/play/` e `/demo/` com `noindex` (são apps, não páginas).
- Variável `SITE_URL=https://zapatro.com` no build (`Shell.tsx:30` já lê `process.env.SITE_URL`).

### 7.8 DNS, hospedagem e redirecionamento

- Registrar `zapatro.com` (busca de disponibilidade antes de divulgar; não verificado nesta sessão).
- Vercel (projeto atual `truco-roguelite`, `bun run site:deploy`): adicionar `zapatro.com` e `www.zapatro.com` como domínios; DNS: `A 76.76.21.21` para o apex e `CNAME cname.vercel-dns.com` para `www` (ou nameservers da Vercel); `www` → apex com 308.
- Manter `truco.lekzera.xyz` apontado para o mesmo projeto e configurar redirect 308 permanente de todo caminho para `https://zapatro.com/:path*` (no `vercel.ts` ou `next.config` `redirects`, ou "Redirect to" no painel de domínios da Vercel); o mesmo para `zapaco.vercel.app`.
- O save do jogo web fica no `localStorage` por origem: quem joga hoje em `truco.lekzera.xyz/play/` perde o progresso ao migrar para `zapatro.com/play/`. Antes do redirect, publicar um aviso no `/play/` antigo com "Exportar save (.json)" e, no novo, o "Importar save" já existente em Configurações. Documentar em `docs/site.md`.
- HTTPS automático (Vercel); HSTS; cabeçalhos `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (sem câmera/microfone); `Cache-Control` imutável para `/play/assets/*` com hash.

### 7.9 Checklist de acessibilidade e performance

- [ ] Contraste ≥ 4,5:1 (dourado `#F4C542` sobre `#2B2B2B` = 10,9:1 ✓; creme sobre `#30261F` ✓; verde `#47B468` com texto `#1A1A1A` ✓).
- [ ] Um `h1` por página, ordem de headings, `alt` nas imagens de conteúdo (capturas do presskit) e `alt=""` nas decorativas.
- [ ] Foco visível em todo link/botão; ordem de tabulação lógica; `skip link` para o conteúdo.
- [ ] `<video>` com `controls`, legendas `.vtt`, sem autoplay com som; `prefers-reduced-motion` respeitado.
- [ ] Seletor de idioma com `aria-label` e `hreflang`; `lang` da página.
- [ ] Alvos de toque ≥ 44 px no móvel (CTAs já são 56–72 px).
- [ ] Lighthouse ≥ 90 em performance, 100 em acessibilidade, boas práticas e SEO (mobile e desktop, medido no PageSpeed Insights fora da rede com antivírus, `docs/site.md`).
- [ ] LCP < 2,5 s: fonte Rubik `display: swap` e pré-carregada; poster do trailer em WebP ≤ 120 kB; sem key art de 1920 px no fundo (fundo chapado = 0 bytes).
- [ ] CLS < 0,1: `width`/`height` no vídeo e nas imagens; CTAs sem troca de tamanho em hover.
- [ ] Peso da home ≤ 600 kB sem o vídeo; `preload="metadata"` no vídeo.

## 8. Especificação de áudio (ElevenLabs)

Inventário atual (`public/assets/audio`): 24 efeitos (`sfx.*`, com takes `.2`), 6 músicas (`music.menu|table|boss|king|win|lose`), 8 ambiências (`amb.<campeonato>`), vozes `vo.<char>.<linha>` para 14 personagens × 8 linhas (truco ×3, demais ×2; exceção `vo.juninho.oloco` ×1). Pipeline: `scripts/el-sfx.ts`, `el-music.ts`, `el-voices.ts`, `audio-normalize.ts` (EBU R128: efeitos e vozes −16, UI −20, música −18, ambiência −30 LUFS; teto −1 dBFS; mono 64 kbps MP3). Nomenclatura: `<categoria>.<grupo>.<nome>[.<take>].mp3`, chave idêntica em `src/data/sfx.ts`.

Faltantes ou recomendados (nenhum existe no catálogo; os gatilhos propostos apontam o evento de domínio que já existe):

| ID / arquivo | Tipo | Onde toca (gatilho) | Prompt ElevenLabs (inglês) | Duração | Loop | Volume rel. (bus, ganho) | Formato | Referência de estilo |
|---|---|---|---|---|---|---|---|---|
| `sfx.zap.reveal` → `public/assets/audio/sfx/sfx.zap.reveal.mp3` | SFX | banner "Você tem o ZAP!" (`TableScene`, ao distribuir mão com o ZAP) | "Short bright magical sparkle sting with a tiny bell, playful, no reverb tail, mono, for a card game highlight" | 0,6 s | não | sfx, 0,7 | MP3 mono 64 kbps, −16 LUFS | tintilar de taça curto |
| `sfx.bet.doze` → `sfx.bet.doze.mp3` | SFX | aposta chega a 12 (`bet` event `to === 12`) | "Dramatic short impact: a heavy wooden table slap followed by a low thud and a quick cymbal choke, dry, mono" | 0,8 s | não | sfx, 0,9 | idem | batida de mão na mesa |
| `sfx.queda` → `sfx.queda.mp3` | SFX | Lance Queda da sua dupla (12 tentos antes da meta) | "Triumphant short brass hit with a rising shaker, bar celebration feel, dry" | 1,0 s | não | sfx, 0,8 | idem | — |
| `sfx.hand.lose` → `sfx.hand.lose.mp3` | SFX | fim de mão perdida (sem pontos) | "Soft descending two-note wooden xylophone, gentle disappointment, dry, mono" | 0,5 s | não | sfx, 0,5 | idem | — |
| `sfx.card.cover` → `sfx.card.cover.mp3` | SFX | carta encoberta (`play` com `faceDown`) | "Single playing card placed face down on felt with a muffled slide, very short, mono" | 0,3 s | não | sfx, 0,55 | idem | `sfx.card.play` mais abafado |
| `sfx.joker.spin` → `sfx.joker.spin.mp3` | SFX | roleta de efeitos do coringa (banner) | "Fast ticking spinning wheel of a small prize drum, 1.2 s, ending in a click, dry" | 1,2 s | não | sfx, 0,6 | idem | roleta de madeira |
| `sfx.boss.intro` → `sfx.boss.intro.mp3` | SFX | entrada na mesa do chefe (`music.boss` já toca) | "Ominous short accordion chord with a low drum hit, Brazilian countryside bar, 1.5 s" | 1,5 s | não | sfx, 0,8 | idem | sanfona |
| `sfx.feat.unlock` → `sfx.feat.unlock.mp3` | SFX (UI) | toast de feito | "Short achievement chime: two ascending glockenspiel notes, clean, no tail" | 0,7 s | não | ui, 0,6 | −20 LUFS | — |
| `sfx.ui.toggle` → `sfx.ui.toggle.mp3` | SFX (UI) | SIM/NÃO em Configurações | "Tiny plastic switch click, very short, mono" | 0,15 s | não | ui, 0,4 | −20 LUFS | — |
| `sfx.ui.slider` → `sfx.ui.slider.mp3` | SFX (UI) | sliders de volume (por passo) | "Very short soft tick, wooden, mono" | 0,08 s | não | ui, 0,35 | −20 LUFS | — |
| `sfx.eleven.enter` → `sfx.eleven.enter.mp3` | SFX | mão de 11 (escurecer a tela) | "Tension riser: low string swell with a heartbeat, 2 s, ends abruptly" | 2,0 s | não | sfx, 0,6 | −16 LUFS | — |
| `sfx.iron.enter` → `sfx.iron.enter.mp3` | SFX | mão de ferro | "Metallic anvil hit with a long dark ring, 2 s" | 2,0 s | não | sfx, 0,7 | idem | — |
| `sfx.promise` → `sfx.promise.mp3` | SFX (UI) | ganhar Promessa ao pular | "Paper note being folded and tucked into a pocket, short, mono" | 0,6 s | não | ui, 0,5 | −20 LUFS | — |
| `music.shop` → `public/assets/audio/music/music.shop.mp3` | Música | loja (hoje reaproveita `music.table`; a confirmar em `src/core/music.ts`) | "Relaxed Brazilian viola caipira and triangle, mid tempo, warm bar afternoon, instrumental, loopable, 60 s" | 60 s | sim (crossfade) | music, 0,8 | MP3 mono 64 kbps, −18 LUFS | `music.table` mais leve |
| `amb.decisive` → `amb.decisive.mp3` (camada) | Ambiência | mão de 11, mão de ferro, aposta ≥ 9 (camada sobre `amb.<campeonato>`) | "Bar crowd going quiet then murmuring with tension, a glass set down, 30 s, loopable" | 30 s | sim | amb, 0,5 | −30 LUFS | GDD §14 "ambiência que sobe na mão decisiva" |
| `vo.juninho.oloco.2` → `sfx/vo.juninho.oloco.2.mp3` | Voz | reação a mão vencida com ≥ 6 tentos (`TableScene:1466`) | Text to Dialogue (`eleven_v4`) com a voz de Juninho já desenhada: "[excited] Ô loco!" | 0,8 s | não | sfx, 0,9 | −16 LUFS | takes existentes de Juninho; se a voz não puder ser reproduzida, regravar as 17 falas do personagem |
| `vo.<char>.onze` (14 personagens × 2 takes) | Voz | entrada na mão de 11 pela dupla rival ou pelo parceiro | "[tense] Mão de onze!" | 0,8 s | não | sfx, 0,9 | −16 LUFS | mesma voz de cada personagem |
| `vo.<char>.ferro` (14 × 2) | Voz | mão de ferro | "[shouting] Ferro!" | 0,6 s | não | sfx, 0,9 | −16 LUFS | idem |

Observações: todos os efeitos mono, sem reverb longo (fundo neutro, Art Bible); vozes só em PT-BR (D-30); nada de música com letra; manter o limitador de vozes (`src/logic/voice-limiter.ts`). Prioridade: `vo.juninho.oloco.2`, `sfx.zap.reveal`, `sfx.bet.doze`, `sfx.queda`, `sfx.hand.lose`, `sfx.card.cover`; o resto é polimento.

## 9. Especificação de assets visuais

Estilo (Art Bible v2): pessoas e ícones pequenos em pixel art (1 px de contorno, ≤ 32 cores, sem AA, múltiplos inteiros); todo o resto vetor chapado por código (`src/art/flat.ts`), sombra sólida 3 px, raio 8/4, sem gradiente ou textura. Paleta em `src/config/palette.ts`.

| ID | Onde é usado | Dimensões e formato | Estilo | Descrição | Critério de aceite |
|---|---|---|---|---|---|
| `store.steam.header` | Steam, header capsule | 920×430 PNG/JPG | vetor + retratos pixel | Logo "ZAPATRO" dourado (Rubik 700, sombra sólida) sobre `#2B2B2B`, leque de 3 cartas (4♣ ZAP, 7♥, A♠) à direita, 2 retratos 128 px (Tonhão e Dona Cida) à esquerda | legível a 50 %; sem texto além do logo |
| `store.steam.small` | Steam, small capsule | 462×174 | idem | logo + 1 carta | idem |
| `store.steam.main` | Steam, main capsule | 616×353 | idem | igual ao header, recortado | idem |
| `store.steam.vertical` | Steam, vertical capsule | 748×896 | idem | logo no topo, 3 retratos em pilha, carta ZAP | idem |
| `store.steam.library` | Steam, library capsule | 600×900 | idem | versão vertical sem retratos | — |
| `store.steam.hero` + `store.steam.logo` | Steam, library hero e logo | 3840×1240 + 1280×720 PNG transparente | vetor | feltro verde chapado com a cruz de cartas; logo separado em PNG alpha | — |
| `store.shots.01-06` | Steam/Play/itch, capturas | 1920×1080 PNG (Play exige ≥ 2, 16:9) | capturas reais | mesa com truco aceito; contagem Fichas × Mult; balcão; escolha de parceiro; mesa do chefe com a regra (após GD-003); Almanaque | capturas do jogo real em 1920×1080 (`bun scripts/shot.ts --size 1920x1080`), sem `(dev)` no rodapé |
| `store.play.icon` | Google Play | 512×512 PNG | pixel + vetor | ícone do app (`art-src/app-icon.svg`, já existe: regenerar com `bun run app-icons`) | — |
| `store.play.feature` | Google Play, gráfico de destaque | 1024×500 PNG | idem ao header | — | — |
| `store.itch.cover` | itch.io | 630×500 PNG | idem | — | — |
| `site.og` | Open Graph/Twitter | 1200×630 WebP + JPG | vetor + retratos | logo, leque, "Fichas × Mult" em azul/vermelhão | ≤ 300 kB |
| `site.favicon` | site e jogo | SVG + ICO 32/48 + PNG 180/192/512 | pixel + vetor | a partir de `art-src/app-icon.svg` | — |
| `site.trailer.poster` | site, poster do vídeo | 1280×720 WebP ≤ 120 kB | captura | frame da contagem | — |
| `card.manilha.plate` | mesa, cartas manilha e ZAP (GD-011) | desenhado em `flat.ts`, 48×64 lógicos | vetor | placa dourada 24×8 no rodapé com "ZAP" (paus) ou ★ (demais manilhas), texto `#231C17` | reconhecível em escala de cinza |
| `icon.sign.<6>` | selo de sinal flagrado no cartão do rival (G-06) | 6 × 32×32 PNG pixel art (`public/assets/gfx/icon/`) | pixel | piscada, sobrancelha, boca torta, língua, lábio, olhar para cima; contorno 1 px, fundo alpha | legível a 1× sobre o cartão escuro |
| `icon.ui.<cart,list,refresh,gamepad,monitor,download>` | botões da loja, Configurações, Controles (hoje vetor em `src/art/icons.ts`) | 6 × 24×24 PNG pixel art (32 px bitmap) | pixel | mesmo traço de `ui-icons.png` | substituem os vetores sem mudar o layout |
| `icon.boss.rule` | cartão do chefe na mesa (GD-003) | 16×16 vetor em `icons.ts` | vetor | ponto de exclamação em círculo dourado | — |
| `portrait.sortuda` (revisão) | chefe A Sortuda | 128×128 PNG existente | pixel | se P-06 decidir, trocar os dados por figa/trevo com edição local | ≤ 32 cores, alpha nos cantos |
| `runend.summary` | fim de run (GD-006) | layout por código no palco 640×360 | vetor | painel com retrato do parceiro 64 px, 5 slots de Manha 32 px, 4 números grandes | ver GD-006 |
| `presskit.logo` | press kit | SVG + PNG 2048 alpha | vetor | wordmark "ZAPATRO" dourado com sombra sólida | — |

## 10. Design system

Fonte da verdade proposta: `src/config/palette.ts` (cores, já existe), `src/config/constants.ts` (`LOGICAL_H`, velocidades), `src/data/characters.ts` (`TABLE_TIMING`), `src/ui/font.ts` (`UI_FONT`, `TEXT_SHADOW`), `src/ui/Button.ts`, `src/ui/panel.ts`, `src/ui/key-hint.ts`, `src/ui/touch.ts` (`uiPx`, `byMode`). O que falta é consolidar os números abaixo num único módulo `src/config/ui.ts` e referenciá-lo nas cenas.

### 10.1 Tokens

| Grupo | Token | Valor | Observação |
|---|---|---|---|
| Cor | `bgNeutral` | `#2B2B2B` | fundo de toda tela |
| Cor | `panel` / `panelDark` / `panelLight` | `#30261F` / `#231C17` / (ver `palette.ts`) | cartões, HUD, modais, item vendido |
| Cor | `manilha` = `money` | `#F4C542` | títulos, foco, números de destaque, borda de manilha |
| Cor | `felt` / `feltBlue` / `feltRed` | `#24644D` / `#2F5C86` / `#8E2F2A` | C1–3 / C4–6 / C7–8 |
| Cor | `cardFace` / `textLight` | `#F8F0DE` / `#F6EEDC` | cartas e texto |
| Cor | `chips` / `mult` | `#3F7FC0` / `#E4572E` | sempre com rótulo (nunca só cor) |
| Cor | `truco` / `good` / `signal` / `calm` | `#D2392F` / `#47B468` / `#2FA7B8` / azul do menu | botões perigo / confirmar / sinal / neutro |
| Cor | `jokerPurple` | ver `palette.ts` | coringa |
| Cor | `shadow` | `#1A1A1A` | sombra sólida |
| Tipo | família | Rubik 400/500/700 (única) | `UI_FONT` |
| Tipo | escala (px lógicos) | 74 título do menu · 38 título de tela · 26 título de modal · 15 número grande · 13 botão · 12 corpo · 10 legenda | passar por `uiPx` no toque (+2) |
| Espaço | grade | 4 px lógicos; margens 6 (feltro) · 8 (cartões) · 12 (painéis) | — |
| Raio | painéis 8 · botões 6 · cartas 4 · selos 3 | igual em toda tela | — |
| Sombra | sólida, deslocada 3 px (4 px em painéis grandes), sem blur | — | — |
| Borda | 2 px: raridade (Comum cinza, Incomum azul, Rara laranja, Lendária roxo) sempre com o nome escrito | — | — |
| Profundidade (depth) | 0 fundo · 5 mesa · 10 cartas · 20 HUD/sidebar · 25 pickers/sinais · 30 balões · 40 painéis de contagem/mão de 11 · 50 modais · 60 toasts · 100 overlay de erro (DOM) | hoje: `setDepth` espalhado em `TableScene` (consolidar) | — |
| Duração | `TABLE_TIMING` (`src/data/characters.ts`): compra/jogada/vaza/contagem; UI 120 ms hover · 160 ms fade de cena · 250 ms modal; `speed` 1×/2×/4× divide | curvas `Quad.easeOut` para entrar, `Quad.easeIn` para sair, `Back.easeOut` só no "TRUCO!" | — |
| Foco | contorno dourado 2 px + selo de tecla à direita | teclado e controle | — |
| Toque | alvo ≥ 44 px físicos; sem selos; texto +2 px | `touchUi` | — |

### 10.2 Componentes e estados

| Componente | Estados obrigatórios | Hoje | Ajuste |
|---|---|---|---|
| `Button` (`src/ui/Button.ts`) | normal, hover (eleva 1 px), foco (contorno dourado + selo), pressionado (desce 1 px, sombra 1 px), desabilitado (cinza, texto 60 %, sem selo) | tem normal/hover/foco/disabled | adicionar pressionado visível; selo fora do cartão na sidebar (GD-009) |
| Cartão de item (`item-card.ts`) | normal, hover (lift), foco, vendido/dim, bloqueado | ok | largura para 4 opções (GD-001) |
| Carta (`flat.ts`) | normal, foco (lift + contorno), manilha (borda + placa), ZAP (borda + placa "ZAP" + pulso), encoberta (verso), jogada (sem foco), desabilitada (esmaecida) | falta placa (GD-011) | — |
| Painel (`panel.ts`) | com título, sem título, modal (escurece a mesa 60 %) | ok | reservar rodapé para dicas (GD-010) |
| Tooltip | aparece em 250 ms no hover/foco, posição que não sai da câmera | existe na seleção (perk/flaw) e nas Manhas | usar no chefe (GD-003) |
| Barra (Meta, Fama) | fundo `panelDark`, preenchimento `manilha` ou roxo, marcador | ok | — |
| Ícone | 24 px pixel art ou vetor; nunca sem rótulo em botão de ação | ok | 6 ícones pixel faltantes (seção 9) |
| Selo de tecla (`key-hint.ts`) | teclado, controle, oculto no toque | ok | — |
| Toggle (Configurações) | SIM/NÃO com o ativo em verde | ok | som `sfx.ui.toggle` |
| Slider | ◀ ▶ + arraste; valor % | ok | som por passo |
| Modal de confirmação | só onde há perda (sair da mesa) | ok | — |
| Toast (feitos) | 3 s, canto inferior, fila | ok | som `sfx.feat.unlock` |
| Balão de fala | creme, cauda, só parceiro e "TRUCO!" | ok | — |

### 10.3 Ajustes por tela

| Tela | Ajustes |
|---|---|
| Menu | nenhum crítico; "Continuar run" desabilitado está legível |
| Escolha de parceiro | gênero dos estilos (GD-007); "Jogar com {nome}" |
| Seleção de mesas | nenhum; manter tooltip de rival |
| Mesa | regra do chefe (GD-003); selo Esc (GD-009); "sem truco" (GD-004); placa de manilha (GD-011); selo de sinal flagrado (G-06) |
| Contagem | ok; manter |
| Balcão | ok |
| Pacote | 4 opções (GD-001) |
| Manhas (painel) | ok |
| Baralho | ok |
| Tutorial | moldura do passo 3 (GD-005) |
| Pausa | ok |
| Fim de run | resumo + plural (GD-006) |
| Almanaque | foco inicial (GD-023) |
| Regras | ok |
| Configurações / Controles | dica do rodapé (GD-010); sons de toggle/slider |
| Overlay de erro (DOM) | trocar `font-family "Pixelify Sans"` por Rubik (`src/core/errors.ts:40`) |

## 11. Plano de execução para os agentes (Opus 5.5)

Cada tarefa cabe numa sessão; `→` indica dependência. Toda tarefa termina com `bun run check`, `bun run typecheck`, `bun test` (afetados), CHANGELOG `[Unreleased]` e o doc tocado, sem push (regras do repositório). "Paralelo" = pode rodar junto com as citadas.

### Fase 0 — Saneamento (sem dependências; 1 sessão)

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-00 | GD-028 | `package.json` | — | todas | `name` = `truco-roguelite` ou decisão em `docs/decisions.md` | `git status` limpo |
| T-01 | GD-016, GD-015 | `docs/release-checklist.md`, `docs/asset-status.md`, `docs/gdd-game-design-document.md` §9/§11/§12/§13.2/§14, `.github/workflows/release.yml:26`, `docs/steam-monitor-resolution-market-research.md` | — | T-02… | nenhuma das 6 divergências listadas; `bun run lint:md` 0 issues | grep das strings antigas = 0 |

### Fase 1 — Bloqueadores e Altos do jogo

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-10 | GD-001 | `src/scenes/RunScene.ts:1170-1236` (`drawPack`), `src/ui/item-card.ts` | — | T-11, T-12 | 4 cartões dentro de 640 px; 3 cartões inalterados | `qa.ts` grupo `pack` com pacote de 4; capturas 1280×720 e 1366×768 |
| T-11 | GD-002 | `src/scenes/TableScene.ts:340-350`, `src/game/match.ts` (goal opcional), i18n `table.*`, GDD §11, Regras p. 12 | — | T-10 | partida rápida termina só por 12 tentos; sidebar sem Meta no modo | script: `?skipMenu=1&seed=1&auto=1&speed=4` termina com `score ≥ 12`; `qa.ts` grupos `end`, `score` ajustados |
| T-12 | GD-027 | `src/scenes/TableScene.ts` (`tilted()`), `desktop/`, `BUGS.md` | — | T-10 | reproduzido e corrigido, ou guarda + teste | `bun run electron:smoke`; soak de 30 min no `.exe` |
| T-13 | GD-004 | `src/i18n/pt-BR.ts:126,159,356,357,744`, `src/i18n/en.ts` (equivalentes), `tests/vocabulary.test.ts` | — | T-10 | `grep "sem truco" src/i18n` = 0; teste cobre a string | `bun test tests/vocabulary.test.ts tests/i18n.test.ts` |

### Fase 2 — Médios de UX e design

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-20 | GD-003 | `src/scenes/TableScene.ts` (cartão do chefe ou sidebar), `src/i18n` (`boss.<id>.rule` já existe) | — | T-21… | regra visível na mesa do chefe em EN e PT-BR | `?skipMenu=1&boss=professor`, capturas 1280×720 e 1366×768 |
| T-21 | GD-005 | `src/scenes/TableScene.ts:428-429`, `src/data/tutorial.ts` | — | T-20 | moldura só na sidebar ou dois retângulos | `qa.ts` grupo `tutorial`; captura do passo 3 |
| T-22 | GD-006 | `src/scenes/RunScene.ts:1237`, `src/i18n` (`run.summary` com plural), `src/logic/meta.ts` (dados da run) | — | T-20 | painel com ≥ 5 dados; "1 mão" | `qa.ts` grupo `runend`; captura |
| T-23 | GD-007, GD-008, GD-025 | `src/i18n/pt-BR.ts:234,528-531,268`, `src/i18n/en.ts:162` e "His pair", descrições EN das Manhas | — | T-20 | nenhum gênero errado; "Quedas" EN legível | `bun test tests/i18n.test.ts`; capturas da escolha de parceiro em PT e EN |
| T-24 | GD-011, GD-026 | `src/art/flat.ts` (placa de manilha, `portraitBg`), `docs/visual.md` §6–7 | — | T-20 | manilha reconhecível em cinza; doc e código iguais | captura `?skipMenu=1&vira=4c&hand=6c,5c,3d`; `bun test tests/icons.test.ts` |
| T-25 | GD-020 | `src/logic/run/run.ts` (Promessa condicional ou meta +15 %), `src/game/run-sim.ts` (`HABITS.skip` ligado no sim), `docs/balancing.md`, GDD §5.3, `docs/decisions.md` | decisão do dev (P-08) | T-20 | pular ≤ +5 p.p. | `bun scripts/sim.ts`, `bun run balance` PASS |
| T-26 | GD-021 | `scripts/stakes.ts`, `docs/balancing.md` | T-25 | — | tabela de Estacas com o elenco novo | `bun scripts/stakes.ts` |
| T-27 | GD-009, GD-010, GD-023 | `src/scenes/TableScene.ts` (sidebar), `SettingsScene.ts`, `KeybindsScene.ts`, `AlmanacScene.ts:132` | — | T-20 | selos e dicas dentro dos painéis; foco inicial no conteúdo | capturas 1280×720 das três telas |
| T-28 | G-06 (seção 3) | `src/scenes/TableScene.ts:1444`, ícones `icon.sign.*` (seção 9) | arte dos selos | T-27 | selo no cartão do rival por 2 s ao flagrar | `qa.ts` grupo `table` (sinal) + captura |

### Fase 3 — Conteúdo faltante (áudio e assets)

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-30 | GD-017 | `src/scenes/BootScene.ts`, `src/core/music.ts`, `vite.config.ts` (`__ASSET_FILES__`) | — | T-31 | download inicial < 8 MB; áudio por Campeonato sob demanda | DevTools rede no `/play/`; `bun run build:poki` < 8 MB |
| T-31 | seção 8 (prioridade) | `scripts/el-catalog.ts`, `scripts/el-sfx.ts`, `el-voices.ts`, `src/data/sfx.ts`, `docs/audio.md` | créditos ElevenLabs | T-30 | 6 efeitos prioritários + `vo.juninho.oloco.2` normalizados e mapeados | `bun scripts/audio-normalize.ts --report`; escuta manual |
| T-32 | seção 9 (ícones e selos) | `public/assets/gfx/icon/`, `scripts/icons.ts`, `src/art/icons.ts`, `tests/icons.test.ts` | PixelLab com créditos (ou desenho manual) | T-31 | 6 ícones pixel + 6 selos de sinal | `bun test tests/icons.test.ts`; capturas |
| T-33 | GD-013 (material) | `docs/media/` (novo), `docs/store-page.md` (novo), `bun scripts/shot.ts --size 1920x1080` | T-10, T-11, T-20 (telas corrigidas) | T-32 | 6 cápsulas, 6 capturas, ícone 512, gráfico 1024×500, OG 1200×630 | revisão visual; tamanhos exatos |
| T-34 | GD-012 | `scripts/record-clips.ts`, `trailer/`, `site/public/trailer/` | T-33 | — | `trailer-en.mp4`, `trailer-pt.mp4`, teaser 15 s, `.vtt` | `cd trailer && bun run render`; vídeo no site local |

### Fase 4 — Polimento e prontidão comercial

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-40 | GD-013 (Steam) | `desktop/package.json` (`steamAppId`), `desktop/steam/app_build.vdf`, `docs/desktop.md`, `docs/launch-game.md` | conta Steamworks (humano) | T-41 | `steam: on`; conquista destravada; depots configurados | `bun run electron:dev` com Steam; upload SteamPipe de teste |
| T-41 | GD-014 | `CREDITS.md`, `docs/decisions.md` (P-06, marca), IARC | humano | T-40 | sem "to be confirmed"; decisões datadas | revisão |
| T-42 | GD-030, GD-018 | — | — | T-40 | soak 30 runs sem crescimento linear de heap; passe de escuta registrado em `docs/audio.md` | `bun scripts/soak.ts`; nota de escuta |
| T-43 | R-02 (seção 3) | `docs/tooling.md`, instalação de `uv` | — | T-40 | `bun run graph` funciona ou fallback documentado | `uvx --version` |
| T-44 | assinatura de código | `release.yml`, `scripts/build-electron.ts`, `docs/desktop.md` | certificado (humano) | T-40 | `.exe` assinado; macOS com Developer ID se publicado | `signtool verify` |

### Fase 5 — Site (zapatro.com)

| ID | Resolve | Arquivos prováveis | Depende | Paralelo | Aceite | Validação |
|---|---|---|---|---|---|---|
| T-50 | seção 7.4–7.5 | `site/src/components/Shell.tsx`, `Pages.tsx`, `Trailer.tsx`, `site/app/globals.css`, `site/src/i18n.ts` | T-33 (OG e poster), T-34 (trailer) | T-51 | Rubik, tokens, fundo `#2B2B2B`, textos novos, trailer à direita | `cd site && bun run dev`; Lighthouse local |
| T-51 | seção 7.7 | `site/src/components/Shell.tsx` (`meta`), `site/public/` (favicons, OG), sitemap/robots, JSON-LD | T-50 | T-50 | metadados completos; `SITE_URL=https://zapatro.com` | validadores OG/Twitter; Rich Results |
| T-52 | seção 7.8 | Vercel (domínios), `vercel.ts`/`next.config` (redirects), `docs/site.md` | domínio comprado (humano) | — | `truco.lekzera.xyz/*` e `zapaco.vercel.app/*` → 308 para `zapatro.com/*`; aviso de migração do save | `curl -I` nos três domínios |
| T-53 | seção 7.9 | site inteiro | T-50, T-51 | — | Lighthouse ≥ 90/100/100/100 | PageSpeed Insights |

Ordem recomendada por sessão: T-00 → T-01 → T-10 → T-11 → T-13 → T-20 → T-21 → T-22 → T-23 → T-24 → T-27 → (T-12 em paralelo, exige Electron) → T-30 → T-31 → T-32 → T-33 → T-34 → T-50 → T-51 → T-40 → T-41 → T-44 → T-52 → T-53 → T-25 → T-26 → T-28 → T-42 → T-43.

## 12. Checklist final de lançamento 1.0

### Gameplay

- [ ] GD-001 (pacote de 4) e GD-002 (partida rápida a 12) corrigidos e cobertos no `qa.ts`.
- [ ] Regra do chefe visível na mesa (GD-003); tutorial passo 3 com moldura certa (GD-005).
- [ ] Decisão sobre pular mesa aplicada e medida (GD-020); Estacas medidas com o elenco novo (GD-021).
- [ ] `bun run balance` PASS nas 3 seeds; `bun scripts/sim.ts` por companheiro registrado em `docs/balancing.md`.
- [ ] 3 runs completas jogadas por humano (PLAN A6.4) com relatório.

### Técnico

- [ ] `bun run check`, `typecheck`, `test`, `build`, `smoke`, `qa.ts` (100 %), `qa-browsers.ts`, `qa-devices.ts --set desktop|mobile` verdes.
- [ ] B-01 fechado com reprodução e teste (GD-027); soak de 30 runs sem vazamento (GD-030).
- [ ] Download inicial web < 8 MB; build Poki < 8 MB (GD-017).
- [ ] `.exe` assinado; `electron:smoke` verde em Windows/Linux; Steam Deck testado (gamepad real, texto a 30 cm).
- [ ] APK/AAB assinados; teste no Galaxy S20 FE; `qa-android.ts` verde.
- [ ] Save compat: `tests/save-compat.test.ts` com o save da 0.10.0; aviso de migração de origem no site.
- [ ] Nenhum texto fora do i18n; `tests/vocabulary.test.ts` com `sem truco` (GD-004).
- [ ] `package.json` `name`/`version` coerentes (GD-028); tag `v1.0.0`; `bun run release` com `.exe`, zips web, AAB.

### Loja Steam

- [ ] App ID, depots, `app_build.vdf`, `steamAppId` (GD-013); conquistas = 37 feitos cadastradas; Auto-Cloud configurado.
- [ ] Página "Em breve" ≥ 2 semanas antes: 6 cápsulas, hero, logo, 6 capturas 1920×1080, trailer, descrição EN/PT-BR, tags (Roguelike Deckbuilder, Card Game, Casual, Singleplayer), idiomas, requisitos mínimos (Windows 10 64-bit, 4 GB RAM, GPU com WebGL 2, 200 MB).
- [ ] Build enviado pelo SteamPipe, testado em Windows, Linux e Steam Deck, na branch `default`.
- [ ] Preço (Q-02) definido com preço regional BR.

### Legal

- [ ] Licenças comerciais ElevenLabs e PixelLab confirmadas e datadas em `CREDITS.md` (GD-014).
- [ ] Busca de marca "Zapatro" (INPI, USPTO) registrada em `docs/decisions.md`; domínio `zapatro.com` registrado.
- [ ] Classificação etária IARC (Play) e questionário de conteúdo da Steam preenchidos; decisão P-06 (dados da Sortuda) registrada.
- [ ] Política de privacidade publicada em EN e PT-BR com data atualizada (já existe; atualizar a data).
- [ ] Créditos no jogo (Estatísticas) e no press kit coerentes (sem "Pixel art with PixelLab" para os retratos de concept).

### Site

- [ ] zapatro.com no ar com a identidade híbrida, trailer à direita, badges reais (Steam wishlist, Play, itch).
- [ ] Redirects 308 de `truco.lekzera.xyz` e `zapaco.vercel.app`; `SITE_URL` novo; OG/Twitter/JSON-LD validados.
- [ ] `/play/` e `/demo/` republicados do build 1.0 (`bun run site:build -- --url …` + `site:deploy`); aviso de export/import de save.
- [ ] Lighthouse ≥ 90/100/100/100 mobile e desktop.
- [ ] Press kit atualizado: capturas híbridas, logo SVG, ficha com data de lançamento e preço.

### Marketing

- [ ] Trailer 60 s + teaser 15 s, EN e PT-BR, no YouTube, na Steam e no site (GD-012).
- [ ] 6 capturas + GIF de 10 s (mão trucada + contagem) para Steam, itch e redes.
- [ ] Demo pública no itch.io e no site; inscrição no Steam Next Fest (demo por conteúdo).
- [ ] Discord e e-mail de contato publicados (`site/src/links.ts`).
- [ ] Texto de lançamento (EN/PT-BR) e lista de imprensa com o zip do press kit.

---

Releitura final (2026-10-25): toda afirmação importante tem arquivo:linha, captura ou saída de comando, ou está marcada como não verificada (seção 2); todos os itens de `game-director-review.md` têm status (seção 3); as 16 combinações de resolução foram testadas (seção 5); cada achado tem critério de aceite (seção 4); as especificações de áudio e de assets trazem ID, arquivo, uso, prompt, duração, loop, volume, formato e aceite (seções 8 e 9); o veredito NO-GO decorre dos dois Bloqueadores comerciais (GD-013, GD-014) e vira GO quando a fase 1 e a fase 4 do plano fecham.
