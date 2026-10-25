# BUGS: Zapatro

> **Foco até a 1.0.0 estável comercial.** Plano de ação de bugs, falhas, defeitos visuais e telas que faltam, no formato de patch notes: cada item diz o que foi visto, a causa, o que foi feito, a data e o commit/versão que resolveu.
> Fonte: prints do dev em [`bugs/<data>/`](bugs/) (jogando o build de cada release) e relatórios de QA. Arte, telas e estilo: skill `svg-concept-art` + [docs/visual.md](docs/visual.md) (Art Bible; pipeline §11).
> Precedência em conflito: AGENTS.md > `.claude/rules/` > GDD > visual.md > PLAN.md > este arquivo.

## Como usar

- **Item novo:** próximo id da seção (`B-` bug, `M-` mockup/arte que falta), severidade, print em `bugs/AAAA-MM-DD/`, status `[ ]`.
- **Resolvido:** marque `[x]`, preencha **Feito em** (data), **Commit** (hash curto) e **Versão** (`vX.Y.Z` do marco que o incluiu). Acrescente a linha no [Patch notes](#patch-notes) e a lição na skill `svg-concept-art` quando for visual.
- **Em andamento / parcial:** `[~]` + o que falta.
- **Severidade:** **P0** trava/perde progresso · **P1** quebra a leitura do jogo ou a primeira impressão · **P2** defeito visível, contornável · **P3** polimento.

## Resumo

> Linha principal (`main`, visual híbrido da Art Bible v2, `docs/visual.md`): os itens de arte pixel/concept da linha antiga estão marcados "n/a" ou "obsoleto pela art bible v2".

| Id | Sev. | Tela | Problema | Status |
| --- | --- | --- | --- | --- |
| B-01 | P0 | qualquer (Electron) | "Algo deu errado": `Cannot read properties of null (reading 'drawImage')` | [ ] |
| B-02 | P1 | menu, mesa, loja, Configurações | Telas ultra-wide espelham a arte: personagens, ⚙/☰ e texto duplicados e invertidos | [x] |
| B-03 | P1 | mesa, seleção de mesas, regras | Retratos antigos em 2× borrados ao lado da arte nova | n/a nesta branch |
| B-04 | P1 | mesa | Cartas jogadas empilhadas no centro, sem distância | [x] |
| B-05 | P1 | mesa | Com 2 ou 1 carta na mão, os polegares seguram o vazio | n/a nesta branch |
| B-06 | P2 | mesa | Polegar mal recortado por cima da carta | n/a nesta branch |
| B-07 | P2 | loja | "Zapatro" vazando sobre a barra, painel da direita vazio, versão sobre a mesa | n/a nesta branch |
| B-08 | P2 | Configurações | Toggles cortados ("NÃO \|"), barra de dicas sobre a arte, título com glifos misturados | n/a nesta branch |
| B-09 | P2 | Controles | Linhas de dica sobrepostas entre si e à versão | [x] |
| B-10 | P2 | mesa | Rótulo do efeito do coringa ("Imitador") por cima das cartas | [x] |
| B-11 | P3 | mesa | Face do coringa é placeholder (triângulos) | n/a nesta branch |
| B-12 | P2 | menu | Botão "Sair" sem ícone | [x] |
| B-13 | P1 | mesa, mockups | Rivais laterais em mesinhas separadas, "sentados" sem pernas; devem jogar apoiados na mesma mesa | n/a nesta branch |
| B-14 | P1 | qualquer (Electron) | Tela congelada sem aviso depois de crash da GPU (contexto WebGL perdido para sempre) | [x] |
| B-15 | P1 | qualquer | MP3 corrompido ou truncado abre o overlay "Algo deu errado" (`EncodingError: Unable to decode audio data`) | [x] |
| M-01 | P1 | Pausa | Mockup ✓ · implementada (`v1.0.0-rc.43`) | [x] |
| M-02 | P1 | Controles | Mockup ✓ · implementada (`v1.0.0-rc.45`) | [x] |
| M-03 | P1 | Regras | Mockup ✓ · falta implementar | [~] |
| M-04 | P1 | Seleção de mesas | Mockup ✓ · implementada (`v1.0.0-rc.46`) | [x] |
| M-05 | P2 | Configurações | Mockup ✓ · falta refazer o spec e implementar | [~] |
| M-06 | P1 | mesa | `hand-1/2.png` com as mãos certas, mas sem SEATING: refazer depois do novo Boteco | obsoleto pela art bible v2 (jogador sem avatar) |
| M-07 | P1 | mesa, retratos | Folhas: Neide, Tonhão, Tião, Zé ✓*; Bia e Juninho ✗ (marcas reais); falta Zé Malandro | [x] substituído por `references/concept-art/zapatro/` (20 retratos) |
| M-08 | P1 | mesa do chefe | Folhas: Rei do Truco ✓; Valentão, Agiota, Delegado, Mudo, Sortuda ✓*; faltam Cartomante, Juiz, Irmãos | [x] substituído por `references/concept-art/zapatro/` |
| M-09 | P2 | todas com concept | `menu-21-9.png` ✗ (miolo diferente); faltam mesa, loja, Configurações | obsoleto pela art bible v2 |
| M-10 | P2 | mesa | `joker.png` ✓* (coroa, naipe extra, proporção) · falta implementar | [~] |
| M-12 | P1 | mesa | Bar de Estrada implementado (`v1.0.0-rc.47`); garagem v2 ✓* a implementar; falta o mockup do Boteco | obsoleto pela art bible v2 (3 feltros) |
| M-14 | P1 | mesa do chefe | O Mudo sem retrato (não havia `char-mudo.png`) | [x] gerado no PixelLab, `art-src/portrait/mudo.png` |
| M-13 | P1 | mesa | Mapas dos Campeonatos 3 a 8 (Quermesse, Clube, Festa do Peão, Regional, Estadual, Rei do Truco) | obsoleto pela art bible v2 (3 feltros) |
| M-11 | P2 | run | Telas restantes sem concept: escolha de parceiro, abertura de pacote, fim de run, Almanaque, tutorial, painel de Lances | [ ] |

## 1. Bugs

### B-01 · P0 · Crash `drawImage` de null

- [ ] **Visto em:** 2026-10-15, build Electron v1.0.0-rc.3 (antes da renumeração; hoje `v1.0.0-rc.29`). Print: [`resolver-bug-algo-deu-errado.png`](bugs/15-10-2026/resolver-bug-algo-deu-errado.png).
- **Sintoma:** tela "Algo deu errado: Cannot read properties of null (reading 'drawImage')". Continuar/Recarregar funcionam; o save é por mão.
- **Causa provável (a confirmar):** o único `drawImage` do jogo é o `tilted()` de `src/scenes/TableScene.ts` (leque da mão), e ele lê `f.source.image`. Se a textura de origem ainda não carregou, foi destruída num restart de cena ou o canvas 2D do Phaser foi recriado, a imagem é `null`. A mensagem diz "properties of null", o que aponta para um contexto/fonte nulo dentro do Phaser (`CanvasTexture.drawFrame`/`context`), não para o nosso `ctx`, que já é checado.
- **Para resolver:** reproduzir (mão com coringa/novo vira, restart de mesa, Electron minimizado/restaurado); log baixado pelo botão "Baixar log"; teste que cobre a troca de textura; guarda em `tilted()` que cai para a carta reta quando `f.source.image` for nulo.
- **Teste 2026-10-25 (Electron real, não reproduzido):** `bun run electron:smoke` ok (canvas em 783 ms). Script local (`.gd/J/b01-electron.mjs`, userData isolado, `dist/` via `app://` com `?run=1&auto=1&speed=4&qa=1`, GPU real: ANGLE D3D11, RTX 4060): 7 min e 181 ciclos de minimizar/restaurar, `setSize` (960×540 a 2560×1080), `hide`/`show` e 18 `WEBGL_lose_context` (`loseContext` com a janela minimizada, `restoreContext` 3 s depois), do Campeonato 1 ao 7: zero erros, zero overlay; o Phaser restaura o contexto toda vez. Mais 4 min com 5 crashes reais do processo da GPU (`chrome://gpucrash`): sem `drawImage`, mas ver o achado abaixo.
- **Análise:** a mensagem exige `ctx` nulo. No Chromium, `getContext('2d')` só devolveu `null` num canvas que já tem contexto WebGL (testado: canvas 0×0 a 70000×10 e 32768² devolvem contexto). No `v1.0.0-rc.3` (`6be48af`) o único `drawImage` do jogo era o de `tilted()`, que já checava `ctx`; hoje os dois `drawImage` (`src/art/flat.ts`) usam o `ctx` recém-criado por `canvasTex`. O Phaser 4.2.1 só chama `drawImage` em WebGL no `CanvasFeatures.checkBlendMode` (boot) e no `CanvasTexture.draw*`, que o jogo não usa. Conclusão: o caminho do print não existe mais e não há rota conhecida para `ctx` nulo no código atual.
- **Achado novo (não é o B-01, virou o B-14, resolvido):** depois do 2º crash da GPU o Chromium desliga a aceleração; o contexto WebGL nunca volta (`renderer.contextLost` fica `true`, `webgl: disabled_off`, canvas novo sem `webgl2`), a lógica continua jogando e a tela congela sem overlay. Proposta: em `desktop/main.js` ligar `enable-unsafe-swiftshader` sempre (hoje só no `--smoke`) e, no jogo, mostrar o overlay de erro com "Recarregar" se `CONTEXT_LOST` durar mais de ~5 s.
- **Feito em:** · **Commit:** · **Versão:**

### B-02 · P1 · Ultra-wide espelha a arte

- [x] **Visto em:** 2026-10-15, monitor 2560×1080 (21:9). Prints: [`menu-inicial-espelhado-botao-sair-sem-icone.png`](bugs/15-10-2026/menu-inicial-espelhado-botao-sair-sem-icone.png), [`botoes-duplicados.png`](bugs/15-10-2026/botoes-duplicados.png), [`hud-do-shop-espelhada-e-com-bugs-visuais.png`](bugs/15-10-2026/hud-do-shop-espelhada-e-com-bugs-visuais.png), [`refazer-menu-configurações-com-prompt.png`](bugs/15-10-2026/refazer-menu-configurações-com-prompt.png).
- **Sintoma:** as faixas laterais mostram o espelho da arte (`fitCamera`, `src/view/concept-stage.ts`, tint `PALETTE.conceptMirror`): personagens cortados ao meio e duplicados, ⚙ ☰ ☰ ⚙, "AOB ATRAC" invertido, painéis de Configurações repetidos. O tint quase não escurece.
- **Causa:** o espelho foi pensado para faixas finas (20:9 em celular). Em 21:9 a faixa é larga e mostra conteúdo reconhecível.
- **Para resolver:** curto prazo: nas laterais, só a borda da arte esticada e bem escura, ou uma textura neutra de parede/madeira, nunca o espelho com conteúdo; longo prazo: M-09 (fundos 21:9). Testar 2560×1080, 3440×1440, 20:9 e 4:3.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.38` (tag) · **Versão:** `v1.0.0-rc.38`
- **O que mudou:** As laterais de telas mais largas (21:9) e de celulares mostram a borda da arte esticada e escurecida, sem personagens, botões ou texto duplicados; o escurecimento passou a funcionar no menu, na mesa e nas Configurações.

### B-03 · P1 · Retratos borrados

- [ ] **Visto em:** 2026-10-15. Prints: [`imagens-borradas-personagens-nao-feitos.png`](bugs/15-10-2026/imagens-borradas-personagens-nao-feitos.png), [`fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png`](bugs/15-10-2026/fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png), [`fazer-mockup-proximos-rounds.png`](bugs/15-10-2026/fazer-mockup-proximos-rounds.png).
- **Sintoma:** Tonhão, Bia, Tião e Neide aparecem como o retrato PixelLab antigo ampliado 2×, borrado e de outro estilo ao lado dos recortes do concept (Dona Cida, Lurdes).
- **Causa:** só tem recorte quem está no concept da sala (`cast` em `src/data/concept-art.ts`); o resto cai no retrato 48×48 em 2×.
- **Para resolver:** M-07 e M-08 (folhas de personagem) → recorte por personagem, usável em qualquer sala e nas telas de seleção/regras.
- **Feito em:** · **Commit:** · **Versão:**

### B-04 · P1 · Cartas empilhadas no centro da mesa

- [x] **Visto em:** 2026-10-15. Print: [`cartas-empilhadas-no-mesa-sem-distancia-adequada.png`](bugs/15-10-2026/cartas-empilhadas-no-mesa-sem-distancia-adequada.png).
- **Sintoma:** a carta do topo (3♠) cobre metade da do jogador (7♣); o J♥ da vez cobre o A♣. Não dá para ler as quatro cartas da vaza.
- **Causa provável:** as posições das cartas jogadas (`offsets` da sala, grupo "cartas jogadas") foram ajustadas para a mesa do concept e ficaram próximas demais para cartas 48×64 com zoom 2.
- **Para resolver:** quatro posições em cruz sem sobreposição (ou sobreposição só da borda), medidas na grade do concept; conferir nas três salas.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.39` (tag) · **Versão:** `v1.0.0-rc.39`
- **O que mudou:** As cartas da vaza ficam escalonadas (topo e você deslocados meio card) e a de baixo fica por cima: todos os índices aparecem.

### B-05 · P1 · Polegares sem carta

- [ ] **Visto em:** 2026-10-15. Print: [`fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png`](bugs/15-10-2026/fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png).
- **Sintoma:** com 1 carta, as mãos ficam abertas nas laterais segurando o vazio; com 2, o leque fica torto.
- **Causa:** `concept.table.thumbs` é uma pose só, feita para 3 cartas.
- **Para resolver:** M-06 (poses para 2 e 1 carta) e trocar a pose pelo tamanho da mão.
- **Feito em:** · **Commit:** · **Versão:**

### B-06 · P2 · Polegar mal recortado

- [ ] **Visto em:** 2026-10-15. Print: [`visual-do-dedo-mal-feito-em-cima-da-carta.png`](bugs/15-10-2026/visual-do-dedo-mal-feito-em-cima-da-carta.png).
- **Sintoma:** o polegar esquerdo sobre o 2♣ tem borda serrilhada e uma "unha" de outra cor; o direito cobre o canto do K♠.
- **Causa provável:** máscara `skin` dos polegares pega tons da carta do concept; o polegar não acompanha a inclinação das cartas.
- **Para resolver:** junto com M-06; recorte com `poly` justo e conferir em zoom 1 px.
- **Feito em:** · **Commit:** · **Versão:**

### B-07 · P2 · Loja com sobras visuais

- [~] **Visto em:** 2026-10-15. Print: [`hud-do-shop-espelhada-e-com-bugs-visuais.png`](bugs/15-10-2026/hud-do-shop-espelhada-e-com-bugs-visuais.png).
- **Sintoma:** o logotipo "Zapatro" amarelo aparece sobre a barra de status, perto de "Baralho"; o painel à direita das Manhas está vazio (sem título nem consumíveis); o rótulo de versão fica por cima das cartas da mesa; colunas escuras nas laterais (espelho, B-02).
- **Para resolver:** achar quem desenha o logo na RunScene (sobra da tela antiga) e removê-lo; rótulo e slots de consumíveis no painel direito; versão numa faixa livre.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.40` (tag) · **Versão:** `v1.0.0-rc.40` (parcial)
- **O que mudou:** Na loja, o título antigo "Zapatro" não aparece mais sobre a barra, a versão não cai em cima da mesa e o painel vazio mostra "Consumíveis 0/2". Falta: as colunas laterais escuras saem com os fundos 21:9 (M-09).

### B-08 · P2 · Configurações

- [ ] **Visto em:** 2026-10-15. Print: [`refazer-menu-configurações-com-prompt.png`](bugs/15-10-2026/refazer-menu-configurações-com-prompt.png).
- **Sintoma:** os toggles "NÃO" saem cortados pela moldura ("NÃO |"); a barra de dicas fica sobre a mesa do fundo e é difícil de ler; títulos dos painéis em fonte pixel com "Ó" e "Ç" de outro tamanho; espelho nas laterais (B-02).
- **Para resolver:** M-05 (concept refeito) ou: largura do toggle pelo texto mais longo das duas línguas, faixa escura sob as dicas, fonte com os acentos.
- **Feito em:** · **Commit:** · **Versão:**

### B-09 · P2 · Controles: dicas sobrepostas

- [x] **Visto em:** 2026-10-15. Print: [`fazer-mockup-controles.png`](bugs/15-10-2026/fazer-mockup-controles.png).
- **Sintoma:** "← → espaço · Enter trocar · Delete limpar · Esc voltar" passa por cima de "Controle (DualSense / Xbox)…" e da versão no rodapé.
- **Para resolver:** layout em colunas com espaço reservado para cada linha; definitivo com M-02.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.41` (tag) · **Versão:** `v1.0.0-rc.41`
- **O que mudou:** Na tela de Controles, a lista, o mapa do controle, as dicas e a versão não se sobrepõem mais. A tela definitiva vem com o concept (M-02).

### B-10 · P2 · Rótulo do coringa sobre as cartas

- [x] **Visto em:** 2026-10-15. Print: [`fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png`](bugs/15-10-2026/fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png).
- **Sintoma:** "Imitador" (efeito do coringa) fica escrito em cima do J♥ e do A♣.
- **Para resolver:** o efeito sai na faixa/banner da mesa (a roleta) ou numa plaquinha acima da carta do coringa, nunca sobre outra carta.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.39` (tag) · **Versão:** `v1.0.0-rc.39`
- **O que mudou:** Os anúncios da mesa (TRUCO!, sorteio do coringa) e a descrição do efeito têm uma plaquinha escura e não se misturam com as cartas.

### B-11 · P3 · Face do coringa

- [ ] **Visto em:** 2026-10-15. Prints: [`imagens-borradas-personagens-nao-feitos.png`](bugs/15-10-2026/imagens-borradas-personagens-nao-feitos.png), [`fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png`](bugs/15-10-2026/fazer-mockups-segurando-2-e-1-carta-e-atualizar-na-tela.png).
- **Sintoma:** a carta "JK" é um placeholder de triângulos coloridos.
- **Para resolver:** M-10.
- **Feito em:** · **Commit:** · **Versão:**

### B-12 · P2 · "Sair" sem ícone

- [x] **Visto em:** 2026-10-15. Print: [`menu-inicial-espelhado-botao-sair-sem-icone.png`](bugs/15-10-2026/menu-inicial-espelhado-botao-sair-sem-icone.png).
- **Sintoma:** todas as linhas do menu têm ícone, menos "Sair".
- **Para resolver:** ícone de porta/saída no mesmo estilo (recortado de um concept ou desenhado no kit de ícones de M-11).
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.44` (tag) · **Versão:** `v1.0.0-rc.44`
- **O que mudou:** No app desktop, "Sair" no menu tem o ícone de porta, como as outras linhas.

### B-13 · P1 · Rivais sem pernas, fora da mesa

- [~] **Visto em:** 2026-10-15, nos mockups novos e nas mesas atuais. Referência: [`references/concept-art/pause.png`](references/concept-art/pause.png) (Lurdes e Joca), [`hand-with-1-and-2-cards.png`](references/concept-art/hand-with-1-and-2-cards.png).
- **Sintoma:** os parceiros e rivais das laterais ficam em mesinhas separadas, "sentados" numa cadeira de madeira sem pernas: o corpo termina na cintura e flutua. Só quem está no topo parece jogar na mesa.
- **Regra (dev, 2026-10-15):** os três jogadores IA jogam **apoiados na mesma mesa** do jogador: antebraços na borda de madeira, a borda esconde a cintura para baixo.
- **Para resolver:** **SEATING BLOCK** em todo prompt com personagens (skill `svg-concept-art`); refazer M-01, M-06 e as salas (M-12); recortes `cast` novos.
- **Feito em:** 2026-10-15 · **Commit:** `1.0.0-rc.47` (tag) · **Versão:** `v1.0.0-rc.47` (parcial)
- **O que mudou:** No Bar de Estrada, Tonhão, Tião e Zé jogam apoiados na mesma mesa. Falta: Boteco (mockup novo) e a oficina do Professor (`table-garage-v2.png`).

### B-14 · P1 · Tela congelada sem aviso depois de crash da GPU

- [x] **Visto em:** 2026-10-25, Electron 44 com GPU real (RTX 4060), ao caçar o B-01 com `chrome://gpucrash` (script local `.gd/J/b01-electron.mjs`).
- **Sintoma:** depois do 2º crash do processo da GPU o Chromium desliga a aceleração; o contexto WebGL nunca volta (`renderer.contextLost` fica `true`), a lógica segue jogando e a tela congela sem mensagem nenhuma.
- **Causa:** o jogo não reagia ao contexto perdido; o Phaser só se recupera se o navegador devolver o contexto.
- **Correção:** `watchContextLoss` (`src/core/errors.ts`, ligado em `src/main.ts`) escuta `Phaser.Renderer.Events.LOSE_WEBGL`/`RESTORE_WEBGL`; se o contexto continua perdido 5 s depois (com a janela visível), mostra o overlay "A placa de vídeo parou de responder" com Recarregar (`error.gpuTitle`/`error.gpuBody`, EN e PT-BR). A lógica e o save não mudam. `desktop/main.js` liga `enable-unsafe-swiftshader` fora do Windows (lá o ANGLE já cai no WARP), para quem tem GPU bloqueada ter WebGL por software ([docs/desktop.md](docs/desktop.md)).
- **Verificação:** com `chrome://gpucrash` o overlay apareceu 5–6 s depois da perda que não voltou, nas 3 rodadas (log e captura em `.gd/s/J/`); 18 perdas restauradas (`WEBGL_lose_context` com `restoreContext` cerca de 3 s depois, e o 1º crash da GPU, que o Chromium recupera) não mostraram overlay. Com GPU boa o renderer continua `ANGLE (NVIDIA … D3D11)` com o switch ligado. Depois que o Chromium desliga a GPU, recarregar a página só mostra "WebGL indisponível"; por isso o Recarregar do overlay de GPU, no Electron, reinicia o app (`restartApp`, ponte `trucoShell.relaunch` no preload, `app.relaunch(); app.exit(0)`). Validado com 2 crashes: overlay → Recarregar → app reaberto em 5 s, na GPU (ANGLE D3D11), mesa desenhando, sem overlay (`.gd/s/J/relaunched-*.png`).
- **Feito em:** 2026-10-25 · **Commit:** · **Versão:**

### B-15 · P1 · MP3 corrompido abre o overlay de erro

- [x] **Visto em:** 2026-10-25 (agente G): um MP3 truncado ou regravado durante o dev vira "Algo deu errado: Unable to decode audio data".
- **Causa:** o `AudioFile` do Phaser 4.2.1 (`loader/filetypes/AudioFile.js`, e o `WebAudioSoundManager.decodeAudio`) chama `decodeAudioData` com callbacks; o Chromium também rejeita a promise que ela devolve, ninguém a aguarda e o `unhandledrejection` de `src/core/errors.ts` mostrava o overlay. O loader já descartava o arquivo (`FILE_LOAD_ERROR` no `BootScene`).
- **Correção:** `installErrorHandler` trata `DOMException` `EncodingError` como aviso (`[assets] audio not decoded: …` no log de erros), sem overlay; o som fica mudo como um arquivo ausente.
- **Verificação:** cópia do `dist/` com `sfx.bet.accept.mp3` trocado por lixo, servida em `vite preview` (`.gd/J/badmp3.ts`): antes, `pageerror` + overlay; depois, aviso no console e no log, sem overlay, partida com o bot seguindo na `Table`.
- **Feito em:** 2026-10-25 · **Commit:** · **Versão:**

## 2. Mockups e arte que faltam

Prompts para o **ChatGPT Plus**, em inglês. Uma conversa nova por item e **uma imagem por mensagem**; cole primeiro o **STYLE BLOCK**, o **GEOMETRY BLOCK** e, em toda imagem com personagens à mesa, o **SEATING BLOCK** da skill [`svg-concept-art`](.claude/skills/svg-concept-art/SKILL.md) §1, e depois o prompt.

Cada item tem duas marcas: **Mockup** (`[x]` = imagem aprovada em `references/concept-art/`) e **No jogo** (`[x]` = tela implementada em SVG, com commit e versão). Anexe o concept aprovado indicado em **Anexar**. Salve o resultado em `references/concept-art/<arquivo>` e siga a skill para virar SVG e tela.

Regra de arquivo: um concept **já implementado** nunca é sobrescrito (os recortes de `src/data/concept-art.ts` dependem dele). A versão nova entra como `<tela>-v2.png` e substitui a antiga só no commit que refaz o spec.

### Revisão da 2ª leva (2026-10-15)

Legenda: ✓ aprovado · ✓* aprovado com ressalva (corrigir quando der) · ✗ refazer. A coluna **Correção** é a mensagem para colar na mesma conversa do ChatGPT.

| Imagem | Item | Veredito | Problema | Correção |
| --- | --- | --- | --- | --- |
| `pause.png` | M-01 | ✓* | Assentos certos (Lurdes e Joca na mesma mesa); sumiu o monte de cartas à direita do painel | `Keep everything identical except restore the face-down deck on the felt to the right of the panel, as in the previous version.` |
| `hand-2.png`, `hand-1.png` | M-06 | ✗ | Mãos e cartas certas, mas Lurdes e Joca continuam em mesinhas separadas (SEATING BLOCK ignorado) | Refazer depois do novo Boteco (M-12), anexando-o: `Keep everything identical except the seating: Lurdes and Joca move to the left and right sides of the same green table, forearms on its rim, no side tables, nothing below the waist visible.` |
| `table-bar-estrada.png` (era `-v2`) | M-12 | ✓ implementado em `v1.0.0-rc.47` | Veio salvo como `table-boteco.png`, mas é o Bar de Estrada (Tonhão, Tião, Zé), com os assentos certos. Renomeado; o `table-boteco.png` original foi restaurado (o jogo usa os recortes dele) | — |
| `table-garage-v2.png` | M-12 | ✓* | Tião e O Professor na mesma mesa; a dica usa "-" no lugar de "·" (o texto é do jogo, sai no `erase`) | — |
| Boteco (Dona Cida, Lurdes, Joca) | M-12 | falta | Ainda não entregue | Prompt de M-12 com o `table-boteco.png` atual anexado |
| `menu-21-9.png` | M-09 | ✗ | A cena foi recomposta em outra escala: o miolo não é idêntico ao `menu-16-9.png` | `Keep everything identical except: paste the attached 16:9 image unchanged, at the same scale, in the centre (x 100–740), and paint only the two new 100-px side strips with street and bar (no people, text or buttons).` |
| `joker.png` | M-10 | ✓* | Chapéu de bobo em vez da coroa de tampinhas; naipe roxo extra sob "JK"; carta mais alta que 3:4 | `Keep everything identical except: replace the jester hat with a crown of bottle caps, remove the purple suit symbol under both "JK", make the card 3:4 (48×64).` |
| `char-bia.png` | M-07 | ✗ | Escudo estilo CBF na camisa (marca real); frase descritiva extra; amostras genéricas | `Keep everything identical except remove the description line, remove the crest from the shirt, and make the swatches the colours actually used.` |
| `char-juninho.png` | M-07 | ✗ | Logo de banda real no boné, camiseta e fones; frase extra | `Keep everything identical except replace every band logo with an original generic doodle and remove the description line.` |
| `char-neide.png` | M-07 | ✓* | Frase extra; amostras genéricas | `Keep everything identical except remove the description line and use only her real colours in the swatches.` |
| `char-tonhao.png` | M-07 | ✓* | Fiel ao Tonhão da mesa; frase extra; cartas amassadas na expressão 2 | `Keep everything identical except remove the description line and redraw the cards in expression 2 as a clean fan.` |
| `char-tiao.png` | M-07 | ✓* | Destoa do Tião da mesa (camisa marrom de trabalho, barba branca cheia) | `Keep everything identical except match the in-game Tião: brown work shirt and full white beard; remove the description line.` |
| `char-ze.png` | M-07 | ✓* | Frase extra | `Keep everything identical except remove the description line.` |
| `boss-valentao.png` | M-08 | ✓* | Frase extra (renomeado de `char-`) | `Keep everything identical except remove the description line.` |
| `boss-agiota.png` | M-08 | ✓* | Uma mão erguida com notas, não apoiada; notas lembram o Real | `Keep everything identical except both forearms rest on the rim in the main view, banknotes generic (no real currency design), remove the description line.` |
| `boss-delegado.png` | M-08 | ✓* | Aponta com um braço; expressões 3 e 4 não são dúvida/irritado; farda de xerife americano | `Keep everything identical except: both forearms on the rim in the main view, expression 3 doubtful, 4 annoyed, a Brazilian civil police look, remove the description line.` |
| `boss-mudo.png` | M-08 | ✓* | Expressões viraram gestos, não neutro/confiante/dúvida/irritado | `Keep everything identical except expressions 1 neutral, 2 confident, 3 doubtful, 4 annoyed; remove the description line.` |
| `boss-sortuda.png` | M-08 | ✓* | A versão 2× é outra pose; expressão 4 não é irritada; a figa parece uma hamsa | `Keep everything identical except the 2x and 1x views copy the main pose, expression 4 annoyed, the amulet is a closed-fist figa, remove the description line.` |
| `boss-reiDoTruco.png` | M-08 | ✓ | Coroa de tampinhas, capa e expressões certas; só a frase extra e amostras genéricas | `Keep everything identical except remove the description line and use his real colours in the swatches.` |

**Ainda falta:** folha do Zé Malandro (M-07, visual a definir); chefes A Cartomante, O Juiz e Os Irmãos (M-08); fundos 21:9 de mesa, loja e Configurações (M-09); Boteco com todos à mesa (M-12); telas da run e kit de ícones (M-11); mapas dos Campeonatos 3 a 8 (M-13).

### M-01 · Pausa

- [x] **Mockup** aprovado com ressalva na 2ª leva (falta o monte de cartas; ver a revisão). Histórico: o de 2026-10-15 estava bom no painel, mas Lurdes e Joca estão em mesinhas separadas e sem pernas (B-13). Salvar como `pause.png` (16:9) · **Anexar:** o `pause.png` atual (painel aprovado) e `table-boteco.png`. Colar o **SEATING BLOCK**.
- [x] **No jogo** (`v1.0.0-rc.43`)

```text
NOW GENERATE THIS IMAGE
Keep the attached pause screen identical (the wooden "Pausa" panel, its three buttons "Continuar", "Configurações", "Sair da mesa", the hint strip "Esc continuar · ↑↓ escolher · Enter confirmar", the player's hands and cards, the room) except the seating, which must follow the SEATING BLOCK:
- Dona Cida stays at the top of the green table, forearms on its rim.
- Lurdes (pink curlers) moves from her small side table to the LEFT side of the same green card table, leaning on its wooden rim with both forearms, cards in hand, facing the centre.
- Joca (green cap, white t-shirt) moves from his small side table to the RIGHT side of the same green card table, leaning on its rim, cards in hand, facing the centre.
- Below the waist nobody is visible: the table rim hides hips and legs. No separate side tables next to them.
The whole scene behind the panel is darkened to about 40% with a flat dark brown overlay, no blur. No other text.
```

### M-02 · Controles

- [x] **Mockup** aprovado em 2026-10-15: [`references/concept-art/controls.png`](references/concept-art/controls.png). Nota: a coluna "Controle" e as teclas são desenhadas pelo jogo a partir de `src/data/keybinds.ts` (o mockup repete □/△ em cartas 2 e 3, sobra do prompt).
- [x] **No jogo** (`v1.0.0-rc.45`)

```text
NOW GENERATE THIS IMAGE
Controls (key bindings) screen mockup of ZAPATRO, same room, panels and title plate as the attached Settings screen. Follow the GEOMETRY BLOCK.
Title plate top centre: "Controles".
Left wooden panel (x 24 to 400): a table with three columns, header row "Ação", "Teclado", "Controle". Rows, each with a small 12 px icon: "Jogar carta 1" [1] (X), "Jogar carta 2" [2] (□), "Jogar carta 3" [3] (△), "Truco / aumentar" [T] (△), "Aceitar" [A] (R1), "Correr" [C] (L1), "Sinal" [S] (□), "Jogar encoberta" [E], "Lances" [L], "Pausar" [Esc] (Options), "Velocidade" [Tab], "Mudo" [M], "Tela cheia" [F11]. Keys drawn as small cream keycaps, controller buttons as small round icons. The first row is focused with a gold border.
Right wooden panel (x 416 to 616): "Vibração" toggle "SIM", "Zona morta" with arrows and "normal", "Controles de toque" with arrows and "auto", then two buttons "Restaurar padrão" (blue) and "Voltar" (red).
Bottom strip: "↑↓ escolher · Enter trocar · Delete limpar · Esc voltar".
No other text.
```

### M-03 · Regras

- [x] **Mockup** aprovado em 2026-10-15: [`references/concept-art/rules.png`](references/concept-art/rules.png). Nota: os rótulos dos assentos são escritos pelo jogo; parceiros ficam um de frente para o outro (Você e Parceiro na diagonal da mesa redonda), não lado a lado como no mockup.
- [ ] **No jogo**

```text
NOW GENERATE THIS IMAGE
Rules book screen mockup of ZAPATRO: an open old notebook of truco rules lying on the bar counter, warm lamp light. Follow the GEOMETRY BLOCK.
The open book fills x 40 to 600, y 40 to 320. Title plate above it: "Regras".
Left page: a page title "1. Duplas e objetivo" and an illustration area 200 by 120 with four seats around a small green table seen from above: two seats marked "Você" and "Parceiro" in green, two marked "Rival" in red.
Right page: an empty area for body text (draw only faint ruled lines, no words) and a small numbered page tab at the bottom "1 / 12".
Bottom of the book: two wooden tab buttons "◀ Anterior" and "Próxima ▶", and a red button "Voltar" centred below.
No other text.
```

### M-04 · Seleção de mesas (próximos rounds)

- [x] **Mockup** aprovado em 2026-10-15: [`references/concept-art/run-select.png`](references/concept-art/run-select.png).
- [x] **No jogo** (`v1.0.0-rc.46`)

```text
NOW GENERATE THIS IMAGE
Championship table-selection screen mockup of ZAPATRO, same bar room, status bar and Manhas shelf as the attached shop. Follow the GEOMETRY BLOCK.
Top: the same status bar ("Boteco do Bairro · Campeonato 1", "Dona Cida nv 1", blue "Baralho (41)" button, coins "$3") and the Manhas shelf with five empty slots and "Manhas 0/5".
Centre: three tall wooden boards side by side (each 180 by 210), like menu boards hanging on the wall:
1 "Mesa Pequena": darker, with a big green stamped tick and the word "Feita".
2 "Mesa Grande": focused with a gold frame; two round portrait medallions of two rivals, the line "Rivais: Bia e Joca", a big blue "Meta: 165 pontos", a gold "Prêmio $4", and two buttons at the bottom: green "Jogar" and blue "Pular (Promessa)".
3 "Mesa do Chefe": red frame, one larger portrait medallion of a stern referee in a striped shirt holding a red card, the name "O Juiz", one short rule line "A Manha mais à esquerda fica desativada", "Meta: 220 pontos", "Prêmio $5", locked padlock icon.
No other text.
```

### M-05 · Configurações (refazer)

- [x] **Mockup** aprovado em 2026-10-15: [`references/concept-art/settings.png`](references/concept-art/settings.png) (substituiu o anterior). Linhas que o jogo não tem (dicas de carta, emotes, interface compacta, resetar progresso, créditos) saem do fundo com `erase`. **Atenção:** os retângulos de `settings` em `src/data/concept-art.ts` são do mockup antigo: refaça o spec antes de rodar `bun run concept:art`.
- [ ] **No jogo**

```text
NOW GENERATE THIS IMAGE
Redo of the attached Settings screen. Keep everything identical except:
1. Every ON/OFF toggle is a wide pill 44 by 14 that fits the words "SIM" and "NÃO" fully inside it, never cut by the panel frame.
2. The bottom hint strip sits on its own dark wooden bar (y 336 to 352) across the whole width, not over the table art.
3. Panel titles "ÁUDIO E VÍDEO", "INTERFACE", "JOGO E SISTEMA" in the same blocky letters with correctly drawn accents Á, Í, Ç.
4. The room extends to the left and right edges with plain wall and shelves, no extra panels.
```

### M-06 · Mão com 2 e com 1 carta

- [ ] **Mockup** (refazer de novo: a 2ª leva, `hand-1.png` e `hand-2.png`, ainda tem os rivais fora da mesa; ver a revisão). Histórico: o `hand-with-1-and-2-cards.png` de 2026-10-15 tem as poses certas das mãos, mas veio com as duas cenas espremidas numa imagem só (cada metade em retrato) e com Lurdes e Joca fora da mesa, sem pernas (B-13). Pedir **uma imagem por mensagem**, 16:9, salvar como `hand-2.png` e `hand-1.png` · **Anexar:** `table-boteco.png` e o `hand-with-1-and-2-cards.png` (só como referência das mãos). Colar o **SEATING BLOCK**.
- [ ] **No jogo**

Mensagem 1:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same Boteco table scene and framing as the attached table-boteco image, seating as in the SEATING BLOCK (Dona Cida top, Lurdes left, Joca right, all leaning on the same green table). Keep the HUD, buttons and panels identical. Only change the player's hands at the bottom centre: the two hands hold a fan of TWO cards (a 5 of clubs and a queen of hearts) tilted -4 and +4 degrees, each thumb pressing the lower inner corner of one card, both card faces fully readable, exactly like the left half of the attached hands reference.
Thumbs with clean 1-pixel outlines, the same skin tone as the reference, no fingernail of a different colour.
```

Mensagem 2 (depois que a 1 estiver aprovada):

```text
NOW GENERATE THIS IMAGE
Same image as the previous one, keep everything identical except the hands: the player now holds ONE card upright (a 3 of diamonds) with both thumbs on its lower corners, the hands closer together, exactly like the right half of the attached hands reference. One single 16:9 image.
```

### M-07 · Folhas de personagem (parceiros e rivais)

- [~] **Mockups** da 2ª leva na revisão acima · **Salvar como:** `char-<id>.png` (3:2), um por personagem: `bia`, `neide`, `juninho`, `zeMalandro`, `tonhao`, `tiao`, `ze` · **Anexar:** `table-boteco.png` (Dona Cida e Lurdes como referência de estilo).

```text
NOW GENERATE THIS IMAGE
Character model sheet for ZAPATRO, ratio 3:2, flat background in one colour #3b2a20, no scenery.
Character: <NAME> — <one-line description: age, build, clothes, hair, signature item, personality>.
Main view, left half: the character seated at the green card table seen from the front, leaning forward with both forearms resting on the table's wooden rim and holding a fan of cards; the rim hides everything below the waist (no legs, no chair seat), as in the SEATING BLOCK, drawn on a 96 by 96 art-pixel grid enlarged 6 times. Same outline, light and skin rendering as Dona Cida in the attached image.
Right half: the same pose at 2x and 1x; then four small expressions at 2x numbered 1 to 4: 1 neutral, 2 confident (calling truco), 3 doubtful (thinking), 4 annoyed (lost the hand).
Bottom strip: square swatches of every colour used, no labels.
Labels exactly: "<NAME>", "1", "2", "3", "4". No other text, no description sentence. The 2x and 1x views are the same main pose scaled down, not new poses. Expressions exactly: 1 neutral, 2 confident, 3 doubtful, 4 annoyed. Swatches: only the colours this character actually uses. No real logos, crests, flags, bands or currency designs on clothes or props.
```

Descrições (uma linha cada, preencha `<NAME>` e a descrição): **Bia** (rival, jovem, cabelo black power, camisa amarela da seleção, confiante) · **Neide** (rival, cabelo preto longo liso, óculos grandes, blusa roxa, calculista) · **Juninho** (parceiro; visual a definir pelo dev) · **Zé Malandro** (parceiro; visual a definir pelo dev) · **Tonhão** (careca, barba, regata vermelha, tatuagens, braços enormes) · **Tião** (idoso, chapéu de couro, bigode branco, camisa xadrez, sério) · **Zé** (chapéu de palha, camisa jeans azul, cigarro de palha, barba por fazer; igual ao retrato atual).

### M-08 · Folhas dos chefes

- [~] **Mockups** da 2ª leva na revisão acima · **Salvar como:** `boss-<id>.png` (3:2) para `valentao`, `cartomante`, `juiz`, `agiota`, `delegado`, `irmaos`, `mudo`, `sortuda`, `reiDoTruco` · **Anexar:** `table-garage.png` (O Professor como referência).

Use o prompt de M-07 com estas trocas: grade 96×96 ampliada 6×, rótulo "<NOME DO CHEFE>", e a regra do chefe como pista visual. **O Valentão** (brigão, jaqueta de couro, punhos cerrados) · **A Cartomante** (lenço, cartas de tarô no lugar do baralho, olhar místico) · **O Juiz** (camisa listrada de árbitro, cartão vermelho, apito) · **O Agiota** (terno barato, maço de notas, anel de ouro; sem símbolo de cassino) · **O Delegado** (farda, distintivo, bigode) · **Os Irmãos** (dois gêmeos lado a lado na mesma folha) · **O Mudo** (silencioso, gestos, lenço no pescoço) · **A Sortuda** (trevo, figa, sorriso) · **O Rei do Truco** (chefe final, coroa de tampinhas, capa, presença de rei do boteco).

### M-09 · Fundos 21:9

- [ ] **Mockups** (o `menu-21-9.png` da 2ª leva precisa ser refeito; ver a revisão) · **Salvar como:** `<tela>-21-9.png` para `menu`, `table-boteco`, `table-bar-estrada`, `table-garage`, `shop`, `settings` · **Anexar:** o concept 16:9 da tela.

```text
NOW GENERATE THIS IMAGE
Extend the attached 16:9 pixel-art scene to an ultra-wide 21:9 image (840 by 360 art pixels, shown enlarged 3 times). Keep the original 640 by 360 area pixel-identical in the centre (x 100 to 740). Fill the new 100-pixel strips on the left and right only with more of the room/street: walls, shelves, plants, bottles, lamps, consistent with the light. No new characters, no buttons, no text, no panels, no cards in the new strips. If the scene has people at the table, they keep following the SEATING BLOCK.
```

### M-10 · Coringa e efeitos

- [x] **Mockup** aprovado com ressalvas na 2ª leva (ver a revisão) · **Salvar como:** `joker.png` (3:2) · **Anexar:** `table-boteco.png` (cartas).

```text
NOW GENERATE THIS IMAGE
Card art sheet for ZAPATRO, ratio 3:2, flat background #3b2a20.
Left: the JOKER playing card, 48 by 64 art pixels enlarged 8 times, cream card with the same border and corner style as the cards in the attached image; centre art: a grinning boteco jester with a bottle-cap crown and a deck of cards, corner index "JK" in purple.
Right: ten round icons 16 by 16 enlarged 4 times, numbered 1 to 10, for the joker's random effects: 1 void (crossed circle), 2 becomes the ZAP (golden club with sparkle), 3 dud (deflated card), 4 worth 3 (a big 3), 5 zeroed (big 0), 6 upside down (card flipped), 7 new vira (card turning), 8 copycat (two identical cards), 9 double (×2), 10 showdown (open eye).
Labels exactly: "JK", "1" to "10". No other text.
```

### M-12 · Salas da mesa com todos à mesma mesa

- [~] **Mockup** (Bar de Estrada e garagem aprovados como `-v2.png`; falta o Boteco) · [ ] **No jogo** · **Salvar como:** `table-boteco-v2.png`, `table-bar-estrada-v2.png`, `table-garage-v2.png` (não sobrescreva os atuais; o spec de cada sala é refeito ao implementar) · **Anexar:** o concept atual da sala. Colar o **SEATING BLOCK**. Uma sala por conversa.

```text
NOW GENERATE THIS IMAGE
Keep the attached table room identical (room, lighting, HUD panel, buttons, the player's hands and cards, the deck, the vira) except the seating, which must follow the SEATING BLOCK: the top, left and right players all sit at the SAME green card table, leaning on its wooden rim with both forearms, cards in hand, facing the centre; the rim hides everything below the waist; remove any small side table next to them. One single 16:9 image. No other change, no other text.
```

### M-13 · Mapas dos Campeonatos 3 a 8

- [ ] **Mockups** · [ ] **No jogo** · Os Campeonatos 3 a 8 ainda usam o fundo antigo (`bg.<lugar>`) com a mesa de fórmica, sem leque de cartas nem polegares. Capturas de 2026-10-15 (bot jogando, 1280×720) em [`references/maps/`](references/maps/). Uma sala por conversa; cole STYLE, GEOMETRY e SEATING BLOCK antes do prompt. Depois de aprovar: spec da sala em `src/data/concept-art.ts` (`room`, `cast`) e `tableRoom()` em `TableScene`.

| Captura | Sala | Mockup | No jogo |
| --- | --- | --- | --- |
| `03-quermesse.png` | Quermesse (Campeonato 3) | [ ] | [ ] |
| `04-clube.png` | Clube (Campeonato 4) | [ ] | [ ] |
| `05-festaDoPeao.png` | Festa do Peão (Campeonato 5) | [ ] | [ ] |
| `06-regional.png` | Regional (Campeonato 6) | [ ] | [ ] |
| `07-estadual.png` | Estadual (Campeonato 7) | [ ] | [ ] |
| `08-reiDoTruco.png` | Rei do Truco (Campeonato 8) | [ ] | [ ] |

**Quermesse** · salvar como `table-quermesse.png` · captura atual: [`references/maps/03-quermesse.png`](references/maps/03-quermesse.png) · anexar `table-boteco.png`, a captura e as folhas de Bia e Lurdes:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Bia and Lurdes on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: a festa junina at night on a dirt churchyard: strings of colourful paper bunting overhead, wooden fences, hay bales, a small bonfire glow, quentão and pamonha stalls with lanterns in the background, a simple chapel facade far behind.
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

**Clube** · salvar como `table-clube.png` · captura atual: [`references/maps/04-clube.png`](references/maps/04-clube.png) · anexar `table-boteco.png`, a captura e as folhas de Joca e Tião:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Joca and Tião on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: the card room of an old social club (clube de bocha e carteado): dark wood panelling, a trophy shelf with small cups, framed old team photos, green felt side tables for dominoes, a ceiling fan and warm lamps, wooden parquet floor.
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

**Festa do Peão** · salvar como `table-festaDoPeao.png` · captura atual: [`references/maps/05-festaDoPeao.png`](references/maps/05-festaDoPeao.png) · anexar `table-boteco.png`, a captura e as folhas de Neide e Joca:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Neide and Joca on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: a card table set up inside a rodeo arena (festa do peão) at night: wooden arena fences with saddles hanging on them, hay bales, tall floodlights, a dark crowd in the stands behind the fence, dirt ground with hoof marks, a bull-riding chute far in the background.
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

**Regional** · salvar como `table-regional.png` · captura atual: [`references/maps/06-regional.png`](references/maps/06-regional.png) · anexar `table-boteco.png`, a captura e as folhas de Bia e Neide:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Bia and Neide on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: a regional truco tournament in a school gym (ginásio): wooden court floor with painted lines, rows of blue plastic chairs, pennants of the local teams hanging from the rafters (no real logos), a scoreboard on the wall showing only numbers, fluorescent lights.
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

**Estadual** · salvar como `table-estadual.png` · captura atual: [`references/maps/07-estadual.png`](references/maps/07-estadual.png) · anexar `table-boteco.png`, a captura e as folhas de Bia e Tião:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Bia and Tião on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: the state championship on a theatre stage: red velvet curtains, brass stanchions with red velvet ropes around the table, spotlights from above, a red carpet floor, an audience in the dark seats in front of and behind the stage.
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

**Rei do Truco** · salvar como `table-reiDoTruco.png` · captura atual: [`references/maps/08-reiDoTruco.png`](references/maps/08-reiDoTruco.png) · anexar `table-boteco.png`, a captura e as folhas de Tião e Neide:

```text
NOW GENERATE THIS IMAGE
One single 16:9 image. Same layout as the attached table-boteco image, pixel for pixel: HUD panel top left, gear and menu buttons top right, the green card table and its wooden rim in the same place and size, the vira and deck, the "Jogadas" panel bottom left, the red/green/blue answer buttons bottom right, the player's two hands with three cards at the bottom centre. Seating as in the SEATING BLOCK (top, left and right players at the same table, forearms on its rim): Tião and Neide on the sides as in their attached sheets, a third player at the top.
Change only the room around the table: the final table of the Rei do Truco: an old luxurious bar with a black-and-gold checkered floor, a wall of bottles lit from below, golden trophies and a championship belt on the counter, chandeliers, a framed portrait of past champions; the Rei do Truco himself sits at the top of the table (attach his sheet).
Same pixel size, palette family and lighting quality as the attached image. No text except what is already on the UI of the attached image.
```

### M-11 · Telas restantes da run e kit de ícones

- [ ] **Salvar como:** `partner-select.png`, `pack-open.png`, `run-end.png`, `almanac.png`, `tutorial.png`, `lances.png` (16:9) e `icons.png` (kit) · **Anexar:** `shop.png`, `menu.png`.
- Base: o prompt de M-04 trocando o centro pelo conteúdo da tela (escolha entre 4 parceiros com nível e passiva; pacote aberto com 3 opções; resumo de fim de run com placar, melhor mão, Manhas e botões "Nova run"/"Menu"; Almanaque com abas Manhas/Chefes/Feitos/Estatísticas; tutorial com balão de fala da Dona Cida; painel de Lances com a lista de mãos e níveis). Kit de ícones: 16×16 ampliado 4×, mesmo traço dos ícones do menu: sair (porta), voltar, som, música, idioma, velocidade, baralho, dinheiro, troféu, cadeado, estrela, sinal.

## Patch notes

Uma linha por item resolvido, mais novo em cima: `vX.Y.Z (data, commit) · Id · o que mudou para o jogador`.

- `v1.0.0-rc.47` (2026-10-15) · B-13 · No Bar de Estrada, Tonhão, Tião e Zé jogam apoiados na mesma mesa. Falta: Boteco (mockup novo) e a oficina do Professor (`table-garage-v2.png`).
- `v1.0.0-rc.46` (2026-10-15) · M-04 · A seleção de mesas agora é o concept: quadros verde, dourado e vermelho com os rivais em medalhões, meta, prêmio, Jogar e Pular, ✓ Feita nas mesas vencidas e o chefe com a regra e o cadeado.
- `v1.0.0-rc.45` (2026-10-15) · M-02 · A tela de Controles agora é o concept: tabela das 13 ações com ícones, duas teclas e o botão do controle, painel de vibração, zona morta e modo toque, e os botões Restaurar padrão e Voltar.
- `v1.0.0-rc.44` (2026-10-15) · B-12 · No app desktop, "Sair" no menu tem o ícone de porta, como as outras linhas.
- `v1.0.0-rc.43` (2026-10-15) · M-01 · A pausa agora é o painel do concept sobre a mesa escurecida: placa, botões dourado/azul/vermelho com ícones e a faixa de dicas. O monte de cartas que sumiu do mockup não importa: atrás aparece a mesa real.
- `v1.0.0-rc.41` (2026-10-15) · B-09 · Na tela de Controles, a lista, o mapa do controle, as dicas e a versão não se sobrepõem mais. A tela definitiva vem com o concept (M-02).
- `v1.0.0-rc.40` (2026-10-15) · B-07 · Na loja, o título antigo "Zapatro" não aparece mais sobre a barra, a versão não cai em cima da mesa e o painel vazio mostra "Consumíveis 0/2". Falta: as colunas laterais escuras saem com os fundos 21:9 (M-09).
- `v1.0.0-rc.39` (2026-10-15) · B-04 · As cartas da vaza ficam escalonadas (topo e você deslocados meio card) e a de baixo fica por cima: todos os índices aparecem.
- `v1.0.0-rc.39` (2026-10-15) · B-10 · Os anúncios da mesa (TRUCO!, sorteio do coringa) e a descrição do efeito têm uma plaquinha escura e não se misturam com as cartas.
- `v1.0.0-rc.38` (2026-10-15) · B-02 · As laterais de telas mais largas (21:9) e de celulares mostram a borda da arte esticada e escurecida, sem personagens, botões ou texto duplicados; o escurecimento passou a funcionar no menu, na mesa e nas Configurações.
