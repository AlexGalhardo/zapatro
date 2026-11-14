# Implementação do Game Director Feedback (2026-10-25)

Acompanhamento da execução de [`game-director-feedback.md`](../game-director-feedback.md) na branch `release/1.0-game-director`. Status possíveis: `Implementado e validado`, `Parcial` (diz o que falta), `Não implementado` (diz por quê), `Discordo` (com evidência), `Não verificado` (diz por quê), `Em andamento` (tarefa ainda rodando nesta sessão). Capturas citadas estão em [`docs/game-director-evidence/`](game-director-evidence/) com o sufixo `-after`.

## 1. Resumo executivo

Todos os achados do jogo que dependiam só de código foram corrigidos e validados jogando no navegador (Playwright, console e rede limpos): pacote de 4 opções, partida rápida até 12 (sem meta; `?goal=N` só para testes), regra do chefe na mesa, moldura do tutorial, fim de run com resumo, vocabulário proibido, gênero dos estilos, inglês do HUD, selo Esc, dicas de rodapé, foco do Almanaque, placa da manilha/ZAP (legível em cinza), selo do sinal flagrado, download inicial web de ~10 MB para 6,6 MB, cinco efeitos sonoros novos, tokens de design (SAFE, PAD, GAP, BUTTON_H, RADIUS, TYPE, SIDEBAR e `panelTex`) e estado pressionado dos botões. Pedidos do dev nesta sessão, também no branch: `bun check` no lugar do `tsc`, botões com texto escuro e estado pressionado, alinhamento e padding em todas as telas, 30 falas de NPC ligadas aos eventos, metas ×2 (com as Estacas recalibradas na proposta da seção 1 de `docs/pending-decisions.md`), parceiro afastado do HUD, manilha e ZAP no canto inferior esquerdo, foco na web e deploy do jogo em `truco.lekzera.xyz/play`. Os testes de robustez (`scripts/qa-web.ts` 15/15 e `scripts/qa.ts` 94 checks) cobrem os caminhos principais.

O material de loja (cápsulas, hero, logo, gráficos Play/itch, OG e 6 capturas 1920×1080 EN/PT) sai de scripts reproduzíveis. O site foi refeito na identidade híbrida, com SEO completo, headers e redirects prontos (desligados até o domínio existir); Lighthouse 100/100/100/100 em mobile e desktop, LCP de 1,5 s, depois da limpeza de JS (valores informados pela coordenação; conferir na bateria final). Foram achados e corrigidos seis defeitos de runtime (N-13 a N-19 na seção 6), incluindo a regressão de `?stake`/`?money`/`?manhas` e o overlay de MP3 corrompido (B-15).

O que impede a 1.0 comercial continua fora do código: conta Steamworks e App ID, assinatura do executável, licenças comerciais confirmadas, busca de marca, classificação etária, domínio `zapatro.com`, a decisão sobre o próximo custo de pular mesa (GD-020) e a escolha da faixa de balanceamento depois das metas ×2 (`docs/pending-decisions.md`). Recomendação na seção 9; o roteiro humano está em `docs/release-1.0-runbook.md`.

Contagem dos GD-001…GD-030 (seção 3): **Implementado e validado: 24 · Parcial: 5 (GD-013, GD-016, GD-018, GD-020, GD-027) · Não implementado: 1 (GD-014) · Em andamento: 0 · Discordo: 0 · Não verificado: 0 · Total: 30.**

Recomendação (seção 9): **GO técnico para a build 1.0.0; NO-GO comercial** até fechar os bloqueadores GD-013 e GD-014 e as decisões de balanceamento.

## 2. Estado de base e gates

| Gate | Antes (`main` `f6cde64`) | Depois (branch) |
|---|---|---|
| Ambiente | Bun 1.4.4, Node 24.21.0, Windows 11 | igual |
| Typecheck | `tsc --noEmit` limpo | `bun check --no-script` (pedido do dev) limpo, 163 arquivos, ~70 ms |
| `bun run check` (Biome) | 204 arquivos, limpo | 214 arquivos, limpo |
| `bun run lint:md` | 0 issues (48 arquivos) | 0 issues |
| `bun test` | 268 pass, 0 fail | 273 pass, 0 fail (o teste de tempo da IA falha só com a CPU saturada; passa isolado, N-05) |
| `bun run build` | ok, JS 1.660 kB (gzip 451 kB) | ok |
| Download até o menu (`vite preview`) | ~10,0 MB | 6,63 MB (10,0 MB no total, resto em segundo plano) |
| `bun run build:poki` | não medido | 5,06 MB |
| `uv`/`uvx` | ausentes; `bun run graph` falhava | `bun run graph` cai para o `graphify` do PATH (4.637 nós) |
| `trailer/` typecheck | sem `node_modules` | instalado do lockfile; 6 arquivos sem erro |
| Bateria final (check, typecheck, test, build, qa, qa-web, smoke) | — | [preencher: resultado da bateria final] |

Decisões do dev nesta sessão: agentes paralelos (sem worktree, por memória); `name` do pacote `zapatro.com`; Promessa condicional (P-08); ElevenLabs/PixelLab só prova + prioridade; `bun check` no lugar do `tsc`.

## 3. Achados GD-xxx

| ID | Sev. | Status | Commit | Evidência da validação | Observações |
|---|---|---|---|---|---|
| GD-001 | Alto | Implementado e validado | `abed6f4` | `getBounds()` dos 4 cartões: 23..167, 173..317, 323..467, 473..617 (dentro de [0,640]) a 1280×720 e 1366×768, PT/EN; `qa.ts` grupo `pack` "all 4 pack options fit the stage"; `GD-001-pack-4-opcoes-*-after.png` | 3 opções inalteradas |
| GD-002 | Alto | Implementado e validado | `523e82a` | `?skipMenu=1&seed=N&auto=1&speed=4`: seeds 1/2/3 terminam 14×7, 12×10, 7×20; `tests/quick-match.test.ts` (20 seeds + chefe); `qa.ts` `end` "ends at 12 tentos, with no points goal"; `GD-002-partida-rapida-*-after.png` | Sidebar "Partida rápida · Truco puro até 12 tentos" e "Tentos: nós × eles"; `?goal=N` liga a pontuação para testes |
| GD-003 | Médio | Implementado e validado | `523e82a` | 10 chefes em PT e EN a 1280×720, professor a 1366×768: regra entre y 25 e 43 num cartão 7–48; `GD-003-mesa-chefe-com-regra-*-after.png` | Modo toque com a regra mais longa: verificação com o agente G |
| GD-004 | Médio | Implementado e validado | `3089671` | `tests/vocabulary.test.ts` falhou com a regra nova antes da correção e passa depois; `rg "sem truco" src/i18n` = 0; `GD-004-sidebar-sem-truco-1280x720-after.png` | "Aposta 1 · normal"; mão de ferro e Renda Extra dizem "ninguém truca/trucou" |
| GD-005 | Médio | Implementado e validado | `523e82a` | passo 3: moldura em [4,48] com 140×235 lógicos (só a sidebar); passo da mão de 11 destaca o HUD; `GD-005-tutorial-passo3-moldura-1280x720-after.png` | Sem passo novo: o HUD ganhou destaque no passo da mão de 11 |
| GD-006 | Médio | Implementado e validado | `abed6f4` | Painel com parceiro, Campeonato, mesas, mãos, melhor mão, $ final, Lance mais alto, quem derrotou e Manhas; "1 mesa vencida · 1 mão jogada"; nada fora do painel em 2 tamanhos × 2 idiomas; `qa.ts` `runend` PASS; `GD-006-*-after.png` | Feitos da run não aparecem no painel (a run não guarda quais foram; já saem em toast). Tela de fim da demo: agente H |
| GD-007 | Baixo | Implementado e validado | `3089671` | `GD-007-parceiro-genero-1280x720-after.png`: "Ataca / Joga na cautela / Blefa / Sem medo", "Jogar com Neide"; traços sem "dele" | Passivas por personagem (Tonhão, Zé Malandro) mantêm o gênero do próprio personagem |
| GD-008 | Baixo | Implementado e validado | `3089671` | `GD-008-mesa-en-quedas-theirs-1280x720-after.png`: "Quedas: us 0 · them ○○" | As quedas dos rivais são os círculos depois do texto |
| GD-009 | Baixo | Implementado e validado | `523e82a` | selo em y 327–337 lógicos, 23 px da borda, a 1280×720 e 3440×1440; `GD-009-esc-*-after.png` | Botões da barra: 34 / 56 / 34 px |
| GD-010 | Baixo | Implementado e validado | `abed6f4` | dica fora de todos os painéis a 1280×720 e 1366×768, PT/EN; `GD-010-*-after.png` | Modo toque não conferido |
| GD-011 | Médio | Implementado e validado | `383b62f` | `GD-011-zap-selo-1280x720-after.png` e `-gray-after.png` (placa "ZAP" e ★ legíveis em cinza), `GD-011-regras-manilha-1280x720-after.png` | Borda 2 px + placa 24×8; `docs/visual.md` §6 alinhado |
| GD-012 | Alto | Implementado e validado | `f545f08` (pipeline), `1b001ca` (clipes) | `trailer/out/`: trailer 60 s EN/PT (1920×1080, master 60 fps e cópia web 30 fps) e teaser 15 s EN/PT (60 fps) com `.vtt`, renderizados em 2026-10-25 no visual híbrido; publicados no site | Steam recebe o trailer quando a página da loja existir (GD-013) |
| GD-013 | Bloq. | Parcial | `17b9a4e`, `e580fd3` | `docs/media/`: 15 artes nos tamanhos exatos (conferidos com sharp) e 12 capturas 1920×1080; `docs/store-page.md` EN/PT | Falta tudo que depende da conta: App ID, depots, `steamAppId`, conquistas, página "Em breve", assinatura do `.exe` (seção 7) |
| GD-014 | Bloq. | Não implementado | — | — | Decisões humanas: licenças comerciais, busca de marca, IARC, P-06 (seção 7) |
| GD-015 | Médio | Implementado e validado | `2373224`, `0ea1d4f` | `bun run lint:md` 0; GDD §9, §12, §13.2, §14 e §5.3/§16.8/§22 alinhados | §11 mantém "Truco puro a 12" e agora o jogo cumpre |
| GD-016 | Médio | Parcial | `2373224` | `rg "150 monstros\|balatro-style\|championships 1-2"` = 0 nos arquivos citados | P-07 (AGENTS × GDD sobre precedência) é decisão do dev |
| GD-017 | Médio | Implementado e validado | `3a6e78b`, `74de879`, `4cb960f` | 6,63 MB até o menu; Poki 5,06 MB; sons adiados chegam ao cache; os 5 efeitos novos tocam nos eventos (interceptando `sound.play` numa partida do bot e forçando uma queda) | `vo.juninho.oloco.2`: Discordo de gerar (N-02) |
| GD-018 | Baixo | Parcial | `328cb10` | Medição dos 317 arquivos (`ebur128`/`volumedetect`): músicas −18,4 e ambiências −30 LUFS no alvo; emendas de loop sem estalo (salto ≤ 0,04); loop da `amb.reiDoTruco` corrigido (mergulho a −83 dB a cada 30 s); 22 efeitos curtos com pico de encoder em 0 dBFS (mantido, ver `docs/audio.md`) | Falta a escuta humana de 15 min |
| GD-019 | Médio | Implementado e validado | `0206433` | build do site ok; Playwright 1920×1080 / 1366×768 / 390×844 EN e PT (uma tela no desktop, trailer à direita, ordem do móvel); metadados e JSON-LD extraídos do HTML; Lighthouse local 100 em acessibilidade, boas práticas e SEO; `GD-019-site-*-after.png` | `site/vercel.json` corrigido (JSON inválido do agente). Press kit: agente I. Performance do Lighthouse não medida |
| GD-020 | Médio | Parcial | `0ea1d4f` | `bun scripts/sim.ts --skip none\|small\|both` (1000 runs, seeds 1 e 2): pular Pequenas +4,7 / +4,5 p.p. ✅; Pequenas e Grandes +15,5 / +12,1 p.p. ❌; `bun run balance` PASS; 2 testes novos em `tests/run.test.ts` | O próximo custo é decisão do dev (ex.: um pulo por Campeonato); meta +15% testada e revertida (+9 p.p.) |
| GD-021 | Baixo | Implementado e validado | `0ea1d4f` | `bun scripts/stakes.ts --runs 1000`: 45,9 / 42,6 / 29,9 / 23,9 / 20,8 / 13,0 / 11,3 / 6,2 %; tabela em `docs/balancing.md` | Medido; 4 degraus fora de 5–8 p.p. (1→2, 2→3, 4→5, 6→7). Com metas ×2 (`cb62ef4`), a curva proposta `goalMult` 1 · 1,1 · 1,15 · 1,2 ×5 dá 24,3 · 20,3 · 17,3 · 15,0 · 12,0 · 8,0 · 5,3 · 2,7 % (300 runs; confirmação a 600 runs em andamento). Decisão do dev (`docs/pending-decisions.md`) |
| GD-022 | Baixo | Implementado e validado | — | Encoberta jogada na UI: "Esconder" cinza na 1ª vaza e ativo na 2ª (`GD-022-encoberta-2a-vaza-1280x720-after.png`) | "A mesma dupla não pede duas vezes seguidas" segue coberta só por teste |
| GD-023 | Baixo | Implementado e validado | `abed6f4` | Enter ao abrir mantém o Almanaque aberto (4 combinações); `GD-023-almanaque-foco-1280x720-after.png` | |
| GD-024 | Baixo | Implementado e validado | `2373224` | doc descreve o palco 16:9 com barras neutras | Feltro largo fica como melhoria futura |
| GD-025 | Baixo | Implementado e validado | `3089671`, `c443d4b`, `5828235` | glossa "literal" sob 58 nomes de Manha no Almanaque em EN (`GD-025-almanaque-glossa-en-after.png`); "their pair"; revisão de copy com 58 edições EN/PT | Nomes em PT mantidos (D-29) |
| GD-026 | Baixo | Implementado e validado | `383b62f` | `docs/visual.md` §7 descreve o fundo por personagem | Código mantido (decisão conservadora) |
| GD-027 | Alto | Parcial | `523e82a` (guarda), `b04ca5f` (registro) | 90 s de stress no navegador; 11 min no Electron com GPU real (RTX 4060): 181 ciclos de minimizar/restaurar/resize/hide, 18 `WEBGL_lose_context`, 5 `chrome://gpucrash`: nenhum `drawImage` nem overlay; `bun run electron:smoke` ok | Não reproduzido; o caminho do print não existe mais no código. Achado N-10 virou B-14 (tela congelada após crashes da GPU, resolvido: `watchContextLoss`); B-15 (MP3 corrompido abria overlay) também resolvido |
| GD-028 | Médio | Implementado e validado | `91cc6e5` | `name` = `zapatro.com` na raiz e em `desktop/`; decisão em `docs/decisions.md` | `appId`, origem, chave do save e `userData` intocados |
| GD-029 | Baixo | Implementado e validado | — | `scripts/qa-web.ts` 15/15 e `scripts/qa.ts` 94 checks (rodadas da bateria de robustez; números informados pela coordenação, conferir na bateria final) | Bateria de robustez refeita no fechamento |
| GD-030 | Baixo | Implementado e validado | — | `bun scripts/soak.ts --runs 8 --pages 2`: heap após GC 9,6 → 11,2 MB e 10,9 → 11,1 MB em 4 runs por página; estabiliza (os ~30 MB por run do relatório eram medidas sem GC) | O gate de 10% do soak dava falso positivo; `scripts/soak.ts` agora usa 2 MB acima da linha de base após o GC |

## 4. Itens da revisão anterior ainda abertos (seção 3 do relatório)

| Item | Status | Commit | Evidência | Observações |
|---|---|---|---|---|
| G-03 / P-08 pular mesa | Parcial | `0ea1d4f` | ver GD-020 | |
| G-06 sinal flagrado sem selo | Implementado e validado | `4cb960f` | `G-06-sinal-flagrado-selo-1280x720-after.png` (Tião com "3") | Usa o balão de expressão do sinal do parceiro; os 6 ícones pixel não foram gerados (seção 5) |
| D-03 curva das Estacas | Implementado e validado | `0ea1d4f` | ver GD-021 | Medido; recalibrar é do dev |
| C-01 vocabulário Malandro | Implementado e validado | `3089671` | ver GD-004 | |
| C-02 versionamento / `name` | Implementado e validado | `91cc6e5` | ver GD-028 | |
| C-05 manilha/ZAP | Implementado e validado | `383b62f` | ver GD-011 | |
| C-06 dados da Sortuda | Não implementado | — | — | P-06 é decisão humana |
| C-12 fundo do retrato | Implementado e validado | `383b62f` | ver GD-026 | |
| C-16 cigarro nos selos | Implementado e validado | — | Os símbolos de Manha são 20 formas vetoriais (`src/art/flat.ts:766-787`), nenhuma é cigarro ou bebida ("cup" é o Copo Americano) | A célula "ZAP" de `ui-icons.png` tem um personagem com algo na boca, mas é descartada pelo `scripts/icons.ts` |
| H-02 cabeçalho `balatro-style` | Implementado e validado | `2373224` | ver GD-016 | |
| H-04 GDD §22 itens 4 e 5 | Parcial | `0ea1d4f` | item 5 atualizado com a Promessa condicional | item 4 (precedência) é P-07 |
| Mudança 4 (site) | Implementado e validado | `0206433` | ver GD-019 | |
| F0.5 / R-02 `uv` | Implementado e validado | `014d4a9` | `bun run graph` → 4.637 nós | Fallback para o `graphify` do PATH |
| P-06 classificação etária | Não implementado | — | — | Humano |
| P-07 precedência GDD × PLAN | Não implementado | — | — | Humano |
| R-05 / B-01 | Em andamento | — | ver GD-027 | |

## 5. Especificações (seções 7–10 do relatório)

### 5.1 Site (seção 7)

| Item | Status | Observações |
|---|---|---|
| 7.3 estrutura e wireframe | Implementado e validado | trailer à direita, uma tela no desktop, ordem do móvel |
| 7.4 tokens | Implementado e validado | variáveis CSS em `site/app/globals.css` |
| 7.5 textos | Implementado e validado | EN/PT exatos; crédito sem "PixelLab" |
| 7.6 trailer | Parcial | `<video>` com `<track>` e `VideoObject` entram sozinhos quando os arquivos existem; placeholder identificado até lá; sem botão do YouTube (não há URL) |
| 7.7 SEO e metadados | Implementado e validado | `favicon.ico`: agente I |
| 7.8 DNS e redirects | Parcial | configuração pronta e desligada em `site/vercel.redirects.example.json`; passo a passo em `docs/site.md`; depende do domínio |
| 7.9 acessibilidade e performance | Implementado e validado | Lighthouse 100/100/100/100 (acessibilidade, boas práticas, SEO e performance) em mobile e desktop, depois da limpeza de JS; LCP 1,5 s; peso da home 230–440 kB (valores informados pela coordenação; conferir na bateria final). Ajustes desta revisão: `fetchPriority` e `preload` do poster do trailer; contraste do texto de fichas (`--color-chips-text`, 5,1:1); seletor de idioma com nome acessível começando pelo texto visível |

### 5.2 Áudio (seção 8)

| ID | Status | Observações |
|---|---|---|
| `sfx.zap.reveal`, `sfx.bet.doze`, `sfx.queda`, `sfx.hand.lose`, `sfx.card.cover` | Implementado e validado | gerados (prova com 2, depois o resto), normalizados a −16 LUFS (±1,5), conferidos por espectrograma e disparados nos eventos; `bet.doze` e `hand.lose` regerados (N-03) |
| `vo.juninho.oloco.2` | Discordo | bloqueio da ElevenLabs (N-02); fica 1 take |
| `sfx.joker.spin`, `sfx.boss.intro`, `sfx.eleven.enter`, `sfx.iron.enter`, `sfx.feat.unlock`, `sfx.ui.toggle`, `sfx.ui.slider`, `sfx.promise`, `music.shop`, `amb.decisive` | Não implementado | no catálogo (`scripts/el-catalog.ts`, tier 2) prontos para gerar; fora da autorização de créditos (só prioridade) |
| `vo.<char>.onze`, `vo.<char>.ferro` (56 falas) | Não implementado | idem; e o Juninho não pode ser regravado |

### 5.3 Assets visuais (seção 9)

| ID | Status | Observações |
|---|---|---|
| `store.steam.*`, `store.play.*`, `store.itch.cover`, `site.og`, `presskit.logo` | Implementado e validado | `bun scripts/store-art.ts`; SVG do logo usa `<text>` com a Rubik embutida (editores podem ignorar a fonte embutida) |
| `store.shots.01-06` | Implementado e validado | `bun scripts/store-shots.ts`, EN e PT, build de produção |
| `site.favicon` | Parcial | SVG, PNG 180/192/512 e manifest; ICO com o agente I |
| `site.trailer.poster` | Implementado e validado | 1280×720 WebP de 41 kB a partir da captura da contagem |
| `card.manilha.plate` | Implementado e validado | ver GD-011 |
| `icon.boss.rule` | Não implementado | a regra do chefe já se lê pelo título vermelho "Mesa do Chefe"; ícone seria redundante |
| `icon.sign.<6>` e `icon.ui.<6>` | Não implementado | PixelLab sem saldo (plano esgotado até 2026-10-26, US$ 0,06); a prova do selo "piscada" saiu com contorno duplo e olho de leitura errada; o carrinho saiu aproveitável, mas nunca foi integrado e o arquivo foi removido de `art-src/` (continua no histórico do git) (misturaria pixel e vetor na mesma barra) |
| `portrait.sortuda` | Não implementado | depende de P-06 |
| `runend.summary` | Implementado e validado | ver GD-006 |

### 5.4 Design system (seção 10)

| Item | Status | Observações |
|---|---|---|
| Tokens (`src/config/ui.ts`) | Implementado e validado | raio, sombra, profundidade e movimento com os valores que o jogo já usava (sem mudança visual); `docs/visual.md` §8.1 |
| Tokens de layout (`src/config/ui.ts`): SAFE, PAD, GAP, BUTTON_H, TYPE, SIDEBAR e `panelTex` (`src/art/flat.ts`) | Implementado e validado | espaçamentos e alturas de botão centralizados; alinhamento e padding aplicados em todas as telas (pedido do dev); `SIDEBAR.w` = 132 px |
| `Button`: pressionado | Implementado e validado | desce 1 px sobre sombra de 1 px; soltar fora cancela (`DS-botao-estados-after.png`) |
| Profundidades do `TableScene` nos tokens | Em andamento | agente G |
| Overlay de erro em Rubik | Implementado e validado | `DS-overlay-erro-rubik-1280x720-after.png` |
| Sons de toggle/slider/feito | Não implementado | depende dos efeitos tier 2 |
| Raio 8/6 proposto | Discordo | mudaria o layout de todas as telas sem ganho de legibilidade; os tokens guardam os valores atuais (6/5) |

## 6. Novos achados

| ID | Achado | Tratamento |
|---|---|---|
| N-01 | O fim da demo dizia "4 parceiros"/"4 partners" (são 10 companheiros) | Corrigido em `3089671` |
| N-02 | A ElevenLabs recusa o Voice Design do Juninho ("brazilian teenage boy, 16 years old": 403 `blocked_generation`, request `76973d7a5e0a93354a4ea7d3a532f86d`): nenhuma fala nova dele sai com a mesma voz | Registrado em `docs/audio.md` |
| N-03 | O `el-sfx.ts` acrescenta "no music" ao prompt: efeitos descritos como instrumento melódico saem como clique e ruído (`sfx.hand.lose` a −43 LUFS) | Prompt reescrito como foley; nota em `docs/audio.md` |
| N-04 | O exemplo do ZAP na página 3 das Regras usava a marca de manilha | Corrigido em `383b62f` |
| N-05 | `tests/ai.test.ts` "a decision takes well under 5 ms" falha com a CPU saturada (44 ms com simulações em paralelo); passa isolado | Teste de tempo sensível a carga; não alterado |
| N-06 | `site/vercel.json` saiu com JSON inválido (`\.` no padrão de cache) e quebraria o deploy | Corrigido em `0206433` (classe `[.]` dentro do grupo, testada contra os caminhos reais) |
| N-07 | Com a partida rápida até 12, o seed 4 do clipe do trailer não escala mais até 12 e a captura da contagem do `site-build` deixaria de pontuar | Seed 7 e `&goal=110` (`f545f08`, `0206433`) |
| N-08 | O cartão final do trailer usava a key art antiga em pixel art (cena de boteco), contra a Art Bible v2 §1 | Fundo chapado `#2B2B2B` (`f545f08`) |
| N-10 | Depois de 2 crashes da GPU o Chromium desliga a aceleração: `renderer.contextLost` fica verdadeiro, a lógica continua e a tela congela sem aviso | Em correção: fallback por software no Electron e overlay após 5 s sem contexto |
| N-11 | `site/vercel.json`, `scripts/site-build.ts` e `scripts/record-clips.ts` dependiam de arquivos e comportamentos que mudaram (ícone PNG, captura sem meta) | Corrigidos |
| N-12 | Um processo `python.exe -` externo a esta sessão (PID 38468) consome um núcleo desde 09:27 e deixa os testes de tempo intermitentes | Relatado ao dev; não encerrado |
| N-09 | Dev servers do Vite calculam `__ASSET_FILES__` na partida: um MP3 novo só toca depois de reiniciar o servidor | Comportamento conhecido; reiniciar o `bun run dev` depois de gerar áudio |
| N-13 | Regressão: `?stake`, `?money` e `?manhas` deixaram de valer na run nova desde `5c8ad3c`; as "runs na Estaca 8" do relatório do diretor rodaram na Estaca 1 | Religados em `1540d05` (stake limitado a 1–8 e disponível mesmo bloqueado; money aplicado; manhas filtradas e limitadas aos slots) |
| N-14 | Trocar o idioma não atualizava as cenas pausadas | Corrigido (tratamento informado pela coordenação; cruzar com CHANGELOG `[Unreleased]`) |
| N-15 | O resize era aplicado com um evento de atraso | Corrigido (tratamento informado pela coordenação; cruzar com CHANGELOG) |
| N-16 | A ambiência ignorava o slider de Música | Corrigido (tratamento informado pela coordenação; cruzar com CHANGELOG) |
| N-17 | MP3 corrompido ou truncado abria o overlay "Algo deu errado" (B-15) | Corrigido: `BUGS.md` B-15 marcado como resolvido |
| N-18 | Os `Graphics` estáticos eram retriangulados a cada quadro | Corrigido (tratamento informado pela coordenação; cruzar com CHANGELOG) |
| N-19 | O site baixava 564 kB de JS em páginas estáticas | Corrigido (tratamento informado pela coordenação); Lighthouse 100 em performance depois da limpeza |

## 7. Pendências humanas

Lista completa, em ordem, com custos marcados "conferir": [`release-1.0-runbook.md`](../docs/release-1.0-runbook.md). Decisões em aberto, com números e recomendação: [`pending-decisions.md`](../docs/pending-decisions.md) (pular mesa, Estacas, faixa do D-39, P-06, P-07, BUGS obsoletos, disco Steam, tag `pixel-art`, trailer PT).

Resumo das pendências:

1. **Steamworks:** App ID, depots, `steamAppId`, 37 conquistas, Auto-Cloud, página "Em breve" e primeiro build pelo SteamPipe.
2. **Assinatura de código:** certificado Windows (ou Azure Trusted Signing) para o `.exe`; Developer ID se houver build macOS.
3. **Licenças:** confirmar e datar em `CREDITS.md` os planos comerciais da ElevenLabs e do PixelLab.
4. **Marca e domínio:** busca de "Zapatro" no INPI (classes 9 e 41) e no USPTO; registrar `zapatro.com`; depois seguir `docs/site.md` (domínios na Vercel, DNS, ativar `site/vercel.redirects.example.json`), publicando antes o aviso de exportar o save no `/play/` antigo.
5. **Classificação etária:** IARC no Play Console e questionário da Steam; decidir P-06 (dados da Sortuda).
6. **Design:** o próximo custo de pular Pequenas e Grandes (GD-020) e a recalibração das Estacas (GD-021); P-07 (precedência GDD × PLAN).
7. **Preço** (Q-02) e data de lançamento.
8. **Créditos:** PixelLab (reset em 2026-10-26) para os 12 ícones; ElevenLabs para os efeitos tier 2 e as falas `onze`/`ferro`, se desejado.
9. **Escuta** de 15 minutos da mixagem (GD-018) e teste num Steam Deck e num Android real.
10. **Trailer:** revisão humana do render e publicação no YouTube (para o botão de fallback do site).

## 8. Checklist de lançamento 1.0

Preenchido a partir da seção 12 do relatório (estado em 2026-10-25):

- **Gameplay:** GD-001 e GD-002 [x]; regra do chefe e tutorial [x]; GD-020 [~] (decisão do dev); Estacas medidas [x] (curva proposta, confirmação em andamento); `balance` e sim por companheiro [~]; 3 runs humanas [ ].
- **Técnico:** download web [x], save compat 0.10.0 [x], vocabulário [x], `name` [x]; gates, B-01, soak, `electron:smoke` no Linux e APK/AAB [~]; `.exe` assinado, Steam Deck, tag e release [ ] (o release sai pela máquina do dev).
- **Loja Steam:** planilha das 37 conquistas e artes, textos e capturas [~]; App ID, build e preço [ ].
- **Legal:** privacidade [x]; créditos [~] (chave `stats.credits` criada; exibição na aba Estatísticas em fechamento); licenças, marca e domínio, IARC e P-06 [ ].
- **Site:** Lighthouse 100/100/100/100 [~, conferir]; publicação em `zapatro.com`, redirects e republicação de `/play` e `/demo` [ ] (dependem do domínio).
- **Marketing:** trailer [~] (render na entrega); capturas [~] (GIF manual pendente); demo [~]; Discord e e-mail [ ]; texto de lançamento [~].

Contagem: [x] 8 · [~] 16 · [ ] 13 (total 37). Esta lista é o rascunho; a bateria final substitui os números.

## 9. Recomendação

**GO técnico para a build 1.0.0; NO-GO comercial.** O jogo está pronto para a build de teste e para o release técnico (gates, QA, builds e tag, depois da bateria final), mas a 1.0 comercial é NO-GO até: (1) fechar GD-013 (conta Steamworks, App ID, depots, conquistas, página "Em breve") e GD-014 (licenças comerciais, marca, IARC, P-06); (2) assinar o `.exe` e testar o Steam Deck e o Android real; (3) decidir o balanceamento (GD-020 e a faixa do D-39 depois das metas ×2, `docs/pending-decisions.md`); (4) publicar o trailer e o domínio `zapatro.com`, com o aviso de exportar o save antes do redirect.

Proposta de frase para o dev: "A 1.0 técnica está pronta para o release; a 1.0 comercial é NO-GO até as pendências humanas do runbook e a decisão de balanceamento."
