# Análise dos trailers de referência (Balatro) → blueprint do trailer de 60 s (RC3)

> Fonte: presskit em `references/Trailers/` (checkout principal, fora do git). Analisado em 2026-09-30 com a skill `watch` (motor local: quadros por troca de cena + quadros de controle) e medição de energia do áudio por segundo com ffmpeg. **Só princípios**: nada de arte, logo, fonte, paleta, música ou layout do Balatro entra no nosso trailer.

| Arquivo | Duração | Áudio | Tipo |
|---|---|---|---|
| `Balatro_trailer_Master_Final.mp4` | 73 s | sim | trailer de lançamento, editado, com closes e "momentos" |
| `balatro-trailer-1.mp4` | 56 s | não | montagem de gameplay (mesmo corte do `-2`, sem trilha) |
| `balatro-trailer-2.mp4` | 56 s | sim | montagem de gameplay com trilha contínua |

## 1. Trailer principal (73 s): lista de planos

| Tempo | Plano | O que mostra | Leitura |
|---|---|---|---|
| 0:00–0:03 | Gameplay cru, mão cheia de cartas, placar `0 × 0` | a mesa e o HUD completos, sem texto | "isto é um jogo de cartas" em 1 s |
| 0:03–0:07 | Seleciona 4 Ases → `60 × 5`, cartas sobem | a jogada básica | mecânica central antes de qualquer truque |
| 0:07 | Corte seco para preto (energia do áudio cai: −26 dB) | respiro | prepara a revelação |
| 0:08–0:11 | Close do Coringa girando sobre fundo verde líquido | o "herói" do jogo, sozinho na tela | apresenta o personagem-mecânica |
| 0:11–0:17 | Volta à mesa; close de 3 Ases grandes; Coringa pulsa | a carta especial muda a jogada | causa → efeito, sem legenda |
| 0:19 | Tela de "Game Over" com Coringa (queda de energia −28 dB) | derrota como parte do loop | honestidade: o jogo é difícil |
| 0:22–0:24 | Pacote celestial girando → coleção de planetas | progressão/colecionáveis | promessa de variedade |
| 0:26 | Close gigante: `Four of a Kind lvl.1  60 × +2` | o número subindo, legível a 1 m da tela | a pontuação é a estrela |
| 0:28–0:29 | Carta de tarô cai sobre a mão, brilho | consumível modificando cartas | segunda camada de sistema |
| 0:33–0:34 | Close das estatísticas → **GAME OVER** grande | fim de run | pausa antes do 2º ato (energia −27/−34 dB) |
| 0:38 | Coringa de novo, entrada limpa | "mais uma run" | recomeço |
| 0:41 | Transição com motion blur | aceleração | começa o crescendo |
| 0:44–0:46 | Vouchers aparecem e se dissolvem em fogo; um voucher cai na mesa | upgrades da run | ritmo mais rápido (cortes de ~1 s) |
| 0:48 | Close do HUD: `Ante 7/8`, `Round 7` | estamos perto do fim | tensão de progresso |
| 0:49 | Loja: Coringa, pacotes, `Reroll $4` | economia | a loja resumida em um plano |
| 0:57 | Mão de 5 Ases decorados | a build pronta | payoff visual |
| 0:59–1:01 | Quebra (energia −30 dB) → `Five of a Kind lvl.5  230 × 32` | a respiração antes do clímax | *drop* |
| 1:02–1:03 | **Clímax**: `280 × 2017` com chamas azuis e vermelhas, números tremendo (pico de energia −14 dB) | o momento "absurdo" | o gancho emocional do trailer |
| 1:04 | Flash branco, carta com o logo aparece | corte para marca | |
| 1:05–1:08 | Logo sobre fundo líquido | marca | |
| 1:08–1:10 | + "COMING FEB 20" + logos de plataforma (Steam primeiro) | data | |
| 1:10–1:13 | "PLAY FINAL DEMO NOW" + Steam (áudio some: −37 → −72 dB) | CTA final | um único pedido de ação |

### Estrutura de batidas

1. **Gancho (0–7 s):** gameplay real e legível, sem título. Mostra a regra básica antes do tempero.
2. **Ato 1 — o twist (8–19 s):** o objeto-chave (Coringa) isolado em close, depois em contexto; termina em derrota.
3. **Ato 2 — sistemas (22–34 s):** pacotes, coleção, pontuação crescendo, consumíveis; termina em GAME OVER (loop).
4. **Ato 3 — crescendo (38–63 s):** cortes cada vez mais curtos (4 s → 1 s), números maiores, **quebra de 2 s** e explosão no clímax.
5. **Marca e CTA (64–73 s):** logo, data, plataformas, um único CTA. Música resolve e silencia.

### Áudio (energia por segundo)

- Trilha contínua, mixada em torno de −19/−20 dBFS RMS; **quedas deliberadas** marcam as viradas: 0:06–0:07, 0:19–0:21, 0:34 e 0:37, 0:59–1:01.
- O pico absoluto (−14 dB) coincide com o número gigante do clímax (1:03); depois fade até o silêncio no CTA.
- Não há narração nem texto explicativo: **os números e os sons de UI contam a história**.

## 2. Trailers de gameplay (56 s)

`balatro-trailer-1` e `-2` são o mesmo corte (o `-1` sem áudio). Montagem de planos de ~4 s: Big Blind → Flush com Coringas → Planetarium → Small Blind com Flush 145 × 19 → The Hook (boss) com "Again!" → Shop (duas vezes) → The Window → coleção de Coringas → flash branco → logo por 10 s. Energia de áudio plana (−21 a −25 dB) e sem quebras: funciona como vitrine de loja, não como trailer de lançamento.

## 3. Princípios que vamos usar

- **Mecânica antes de marca:** abrir com a mesa real, 3 cartas na mão, e uma jogada que se entende sem legenda.
- **Um objeto-herói por ato:** para nós, a **carta TRUCO!** (o grito) no ato 1 e uma **Manha** no ato 2.
- **O número é o protagonista:** closes da contagem Fichas × Mult com tremor proporcional (Style Bible §6, *juice*).
- **Derrota no meio**: mostrar que dá para perder (a Queda) torna o clímax crível.
- **Cortes aceleram**: 4 s → 2 s → 1 s nos últimos 20 s; uma quebra de ~2 s antes do clímax.
- **Um CTA só** no fim (Steam / "Jogue a demo"), plataformas em linha, música resolvendo.
- **Legibilidade a distância:** cartas e números enormes em close; nada pequeno demais para um celular.

## 4. Blueprint do nosso trailer (60 s, Remotion, RC3)

| Tempo | Plano | Conteúdo (nosso) | Áudio |
|---|---|---|---|
| 0:00–0:04 | Mesa de fórmica vista de cima, 4 jogadores em cruz, vira sendo revelada | `table.formica` + `bg.botecoBairro`, `card.back.default` virando | `amb.botecoBairro` + `sfx.card.flip` |
| 0:04–0:08 | Você joga um 3, vaza ganha | cartas 48×64 em close 4× | `sfx.card.play`, `sfx.trick.win` |
| 0:08–0:10 | Corte seco, tela escura, só o retrato do Tonhão piscando | `portrait.bruto.wink` | silêncio + `sfx.signal` |
| 0:10–0:13 | **TRUCO!** batida, zoom punch, tremor | `ui.button.truco`, balão "TRUCO!" | `sfx.truco` + `vo.bruto.truco` + início de `music.table` |
| 0:13–0:18 | Rival pensa (`sweat`), aceita "SEIS!" | `portrait.ze.sweat`, `portrait.mia.angry` | `vo.mia.seis` |
| 0:18–0:24 | Contagem Fichas × Mult subindo, Manha ativando | `ui.chip`, `ui.mult`, `manha.malandro` | `sfx.score.chip` em pitch crescente, `sfx.manha.trigger` |
| 0:24–0:27 | **Queda**: a mesa escurece, placar zera | vinheta, `sfx.table.lose` | quebra de energia |
| 0:27–0:33 | Loja do boteco: pacotes abrindo, Manhas, Simpatias | `pack.*`, `simpatia.*`, `lance.*` | `sfx.pack.open`, `sfx.shop.buy` |
| 0:33–0:40 | Campeonatos passando (fundos trocando a cada 1 s) | `bg.*` dos 8 Campeonatos | `music.table` acelerando |
| 0:40–0:46 | Chefes em sequência, 1 s cada, retrato 128×128 em close | `boss.valentao` … `boss.reiDoTruco` | `music.boss` |
| 0:46–0:48 | Quebra: silêncio, mão de ferro (vinheta), 3 manilhas na mão | | respiro |
| 0:48–0:52 | **Clímax**: DOZE! aceito, contagem gigante ×Mult com vidro quebrando | números em BitmapText 8× | `sfx.score.xmult`, `vo.*.doze`, pico da trilha |
| 0:52–0:55 | Flash, Rei do Truco derrotado, mesa aplaudindo | `boss.reiDoTruco`, `sfx.table.win` | `music.win` |
| 0:55–0:60 | Logo + "Jogue agora" + Steam / Google Play / web | key art | trilha resolve e silencia |

## 5. Lições para os nossos assets

- Cartas precisam funcionar em **close 4–8×**: bordas limpas, índices grossos, figuras com silhueta forte (feito nas faces 48×64).
- Um **fundo de mesa com textura discreta** deixa as cartas saltarem (fórmica com salpicado de baixo contraste, não padrão gritante).
- A contagem de pontos pede **cores de Fichas e Mult bem separadas** (usamos azulejo e vermelho de fórmica da nossa paleta, nunca os tons exatos do Balatro).
- Estados especiais (mão de 11, mão de ferro, clímax) ganham **tratamento de tela inteira** (vinheta, chamas), não só um ícone: previsto nas sobreposições `card.mod.quente` e nas vinhetas da render.
- Precisamos de **key art 1920×1080** e retratos grandes para os closes (`boss.*` 96×96 escalam bem até 8×).
