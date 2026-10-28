# Áudio final do jogo 1.0 (vozes EN + PT-BR e 3 músicas novas)

Plano e orçamento do lote final de áudio da 1.0. **Status (2026-10-28): gerado, normalizado, integrado e checado.** 836 takes de voz (19 personagens × 11 falas × 2 takes × 2 idiomas) e `music.table2`, `music.table3`, `music.table4` (58 s, loop); custo real ~14.500 créditos com as 3 músicas (o `bruto` sozinho, 168). Este arquivo guarda os prompts enviados à ElevenLabs como histórico e referência; as seções 3 e 8 descrevem o que ficou no jogo. O pipeline está em [audio.md](audio.md); os scripts são `scripts/el-*.ts` e `scripts/audio-check.ts`.

**Resultado da checagem** (`scripts/audio-check.ts`, detalhes em [audio.md](audio.md#checagem-do-lote-final-2026-10-28-scriptsaudio-checkts)): os 845 takes de voz e música passam. Vozes −17,5 a −15,9 LUFS (alvo −16 ±2), 0,6 a 7,0 s, pico decodificado ≤ −0,5 dBFS sem clipping, nenhuma vazia, cortada ou duplicada; músicas −18,4 LUFS, emendas de loop sem salto acima do passo da própria música. Nenhum take foi regerado (0 créditos extras). O conteúdo falado não foi conferido por transcrição (não há whisper nesta máquina) e falta a escuta humana.

## 1. Escopo

- **Vozes:** cada personagem do elenco ganha **uma voz própria, desenhada pelo gênero e pela aparência da pintura**, falando em **português e inglês**. O idioma escolhido nas Configurações decide qual versão toca.
- **Falas padrão (8, iguais para todos):** TRUCO!, SEIS!, NOVE!, DOZE!, Tô fora!, Bora!, Quero ver!, Tá de sacanagem comigo!
- **Falas únicas (3 por personagem):** comédia ou paródia da personalidade, sorteadas durante a partida.
- **Música:** 3 temas novos em loop para as mesas (sol, praia, Miami Beach, Havaí, cassino, bar paulista).

## 2. Elenco (19 vozes)

Fonte: 10 companheiros em `src/data/companions.ts`, 8 chefes do `BOSS_POOL` e o `reiDoTruco` (`src/data/bosses.ts`); nomes em `char.<id>` e `boss.<id>.name` (i18n). Aparência lida em `art-src/gta/char-*.jpeg`. Desde a v1.0 os ids do código, dos arquivos e das chaves de áudio são os nomes reais dos personagens, não os apelidos antigos (ver "Renomeio" abaixo).

| id (chave) | Nome | Gênero | Papel |
|---|---|---|---|
| `bruto` | Bruto | M | companheiro |
| `cida` | Cida | F | companheira |
| `jhony` | Jhony | M | companheiro |
| `nino` | Nino | M | companheiro |
| `ze` | Zé | M | companheiro |
| `mia` | Mia | F | companheira |
| `chico` | Chico | M | companheiro |
| `beti` | Beti | F | companheira |
| `ayla` | Ayla | F | companheira |
| `sheila` | Sheila | F | companheira |
| `valentao` | O Valentão | M | chefe |
| `cartomante` | A Cartomante | F | chefe |
| `juiz` | O Juiz | M | chefe (sem pintura ainda) |
| `agiota` | O Agiota | M | chefe |
| `tony` | Tony (O Delegado) | M | chefe |
| `stuart` | Stuart | M | chefe |
| `peter` | Peter | M | chefe |
| `sortuda` | A Sortuda | F | chefe |
| `reiDoTruco` | O Rei do Truco | M | chefe final |

Observações da leitura das pinturas:

- `char-valentao.jpeg` é **idêntico** (mesmo hash) a `char-bruto.jpeg`, e `char-cartomante.jpeg` a `char-beti.jpeg`. Valentão e Bruto, Cartomante e Beti dividem a pintura. As vozes serão diferentes mesmo assim (Valentão mais grave e ameaçador; Cartomante teatral e sussurrada; Beti calorosa e fofoqueira).
- `peter` (Peter) tem regra de chefe "sem sinais com o parceiro". Para falar, ele vira o **tipo calado**: voz baixa e pausada, falas curtas.
- O Voice Design recusou em 2026-10-25 a descrição de um adolescente (`blocked_generation`). Todos os personagens abaixo são adultos.

## 3. Estrutura de arquivos e chaves

- Uma **única voz desenhada por personagem** fala as duas línguas (mesma identidade nos dois idiomas; sotaque brasileiro leve no inglês).
- Chave (como ficou): `vo.<lang>.<id>.<fala>`, em `public/assets/audio/sfx/vo.<lang>.<id>.<fala>.mp3` (+ `.2.mp3` para o 2º take), com `<lang>` = `pt` ou `en`. Brutos em `art-src/elevenlabs/vo/vo.<lang>.<id>.<fala>/<n>.mp3`. (O plano previa uma pasta por idioma; ficou o idioma na chave, na mesma pasta `sfx/`.)
- Falas padrão: `truco`, `seis`, `nove`, `doze`, `corre` (Tô fora), `bora`, `ver` (Quero ver), `sacanagem`. Falas únicas: `piada1`, `piada2`, `piada3`.
- Mapeamento no jogo: `truco/seis/nove/doze` no pedido; `bora` ou `ver` (sorteio) ao aceitar; `corre` ao correr; `sacanagem` ao correr de uma aposta de 6 pontos ou mais; `piadaN` sorteada em momentos calmos da mesa. As antigas `caiu` e `oloco` saem do catálogo (as falas únicas as substituem).
- Código (feito em 2026-10-28): `VO_LINES`, `VO_JOKES`, `VO_SACANAGEM_BET` e `VO_JOKE` em `src/data/sfx.ts`; a escolha das falas e da chave por idioma em `src/logic/voice-lines.ts` (lógica pura, `tests/voice-lines.test.ts`); `voice()`/`voiceBusy()` em `src/core/audio.ts`; os gatilhos em `src/scenes/TableScene.ts`; o sorteio da música (`tableMusic`) em `src/core/music.ts`; a ordem de carga em `src/data/load-order.ts` e `loadVoices` em `src/scenes/BootScene.ts` (chamado pelas Configurações ao trocar de idioma). Piadas tocam só como voz (sem balão de texto). Os arquivos antigos `vo.<id>.*` sem idioma e seus brutos foram apagados.

## 4. Falas padrão

Cada fala sai com **2 takes** (entregas diferentes), uma audio tag por take (`[shouting]`, `[excited]`, `[annoyed]`…), modelo `eleven_v4` Text to Dialogue como hoje.

| Chave | PT-BR | EN | Tag base |
|---|---|---|---|
| `truco` | TRUCO! | TRUCO! | `[shouting]` |
| `seis` | SEIS! | SIX! | `[shouting]` |
| `nove` | NOVE! | NINE! | `[shouting]` |
| `doze` | DOZE! | TWELVE! | `[shouting]` |
| `corre` | Tô fora! | I'm out! | `[sighs]` / `[annoyed]` |
| `bora` | Bora! | Let's go! | `[excited]` |
| `ver` | Quero ver! | Show me! | `[confident]` |
| `sacanagem` | Tá de sacanagem comigo! | You're kidding me! | `[outraged]` |

## 5. Falas únicas por personagem

Prompts de voz em inglês (a ElevenLabs desenha melhor assim). Cada prompt junta idade, gênero, timbre, sotaque e a personalidade lida na pintura.

### Companheiros

| id | Pintura e personalidade | Prompt de voz (Voice Design) | Falas únicas (PT-BR / EN) |
|---|---|---|---|
| `bruto` Bruto | Homem robusto de ~40, barba, charuto, correntes de ouro, tatuagens ("Respeito", caveira coroada), cara fechada; placa "Aqui não tem conversa fiada". Durão, de poucas palavras | `Big burly Brazilian man in his 40s, very deep gravelly voice, slow and intimidating but with dry humor, smoker's rasp, Sao Paulo accent` | 1. "Aqui não tem conversa fiada!" / "No small talk at this table!" 2. "Respeito é o que eu cobro, e hoje tá caro." / "Respect is what I charge, and today it's pricey." 3. "Segura a cerveja que lá vem trovão." / "Hold your beer, here comes thunder." |
| `cida` Cida | Mulher gordinha de ~50, lenço vermelho, argolas, blusa de oncinha, cerveja na mão, gargalhada. Festeira e boca solta | `Brazilian woman in her 50s, warm husky laugh in her voice, loud cheerful gossipy bar-owner energy, Sao Paulo accent` | 1. "Ai, que dó... de vocês!" / "Aww, how sad... for you!" 2. "Tô na cerveja, mas na cartada eu tô sóbria!" / "I'm on the beer, but my cards are sober!" 3. "Pode vir, meu bem, a tia Cida não perdoa!" / "Come on, honey, Auntie Cida doesn't forgive!" |
| `jhony` Jhony | Jovem de ~25, óculos na cabeça, camisa de palmeira, correntão de $, maço de notas de 100, sorriso de lado. Malandro vaidoso | `Brazilian man in his mid 20s, smooth cocky street-smart voice, slick and playful, confident smirk you can hear, Rio-influenced accent` | 1. "Esse jogo eu pago em dinheiro vivo!" / "I'm paying for this game in cold cash!" 2. "Relógio de ouro não marca hora de perder." / "A gold watch doesn't tell the time for losing." 3. "Até meu colar tá rindo de vocês!" / "Even my chain is laughing at you!" |
| `nino` Nino | Jovem de ~28, boné virado, camisa 10 da seleção, joinha, favela e Cristo ao fundo, "Vida Loka". Boleiro carismático | `Young Brazilian man in his late 20s, energetic friendly voice, football-fan enthusiasm, fast and playful, Rio carioca accent` | 1. "Camisa 10 em campo, bicho!" / "Number 10 on the pitch, man!" 2. "Eu jogo truco igual jogo bola: no drible!" / "I play truco like I play football: with a dribble!" 3. "Gol de placa, meu povo!" / "What a goal, folks!" |
| `ze` Zé | Homem calvo de ~60, bigode, avental verde, pano no ombro, cerveja na mão, sorriso safado; dono de bar na praia | `Brazilian man in his 60s, friendly raspy voice, warm bar-owner banter, slightly nasal with a strong caipira accent, always smiling` | 1. "Fiado só amanhã, mas carta é na hora!" / "Credit is for tomorrow, but cards are for now!" 2. "Esse truco eu aprendi atrás do balcão." / "I learned this truco behind the counter." 3. "Uma gelada por conta da casa, que eu cobro depois!" / "A cold one on the house, I'll bill you later!" |
| `mia` Mia | Loira de ~28, rabo de cavalo, regata, tatuagem de hibisco, olhar confiante; praia e academia | `Young Brazilian woman in her late 20s, confident sporty voice, teasing and a little flirty, bright and loud, beach-town accent` | 1. "Treino pesado, jogo leve, vitória na mão!" / "Heavy workout, light game, victory in hand!" 2. "Pode olhar, mas só quem aguenta o peso vence." / "Go ahead and look, only the strong win." 3. "Meu bíceps trabalha, minha cartada também!" / "My biceps work, and so does my play!" |
| `chico` Chico | Homem de ~35, chapéu de couro, palito na boca, bigode, toalha, tatuagem de peixe; pescador e peão relaxado | `Brazilian man in his mid 30s, relaxed easygoing country voice, lazy drawl, chuckling, caipira accent` | 1. "Peixe grande não cai em anzol pequeno!" / "Big fish don't bite small hooks!" 2. "Pode vir, que o chapéu dá sorte!" / "Come on, the hat is lucky!" 3. "Tô só no palito, esperando a sua jogada." / "Just chewing my toothpick, waiting for your move." |
| `beti` Beti | Mulher de ~50, lenço com moedas, bola de cristal, velas, olho grego, unhas vermelhas; cartomante simpática e fofoqueira | `Brazilian woman in her 50s, rich warm theatrical voice, dramatic gossipy whisper that rises into laughter, mystical but cozy` | 1. "A bola de cristal disse que você vai perder!" / "The crystal ball says you will lose!" 2. "Dá a mão que eu leio... o seu blefe!" / "Give me your hand and I'll read... your bluff!" 3. "Vela acesa, sorte garantida, meu filho!" / "Lit candle, guaranteed luck, dear!" |
| `ayla` Ayla | Jovem de ~25, boné ao contrário, piercing no nariz, camiseta "Rock baby", skate com caveira; skatista rock | `Young Brazilian woman in her mid 20s, raspy punk-rock attitude, relaxed sarcastic cool, a bit of vocal fry, Sao Paulo city accent` | 1. "Rock baby! Esse truco é pesado!" / "Rock baby! This truco goes hard!" 2. "Meu skate tem mais manha que o seu baralho!" / "My skateboard has more tricks than your deck!" 3. "Vem na manobra, que eu caio e levanto!" / "Bring the trick, I fall and get back up!" |
| `sheila` Sheila | Mulher de ~32, óculos no coque, bolsa de grife, ouro, unhas vermelhas, pose de diva | `Brazilian woman in her early 30s, glamorous sultry voice, slow and sassy, diva who is bored and amused, polished accent` | 1. "Amor, esse jogo é caro, mas eu tô bem acompanhada!" / "Darling, this game is expensive, but I'm in good company!" 2. "Bolsa de grife, jogada de rainha!" / "Designer bag, queen's play!" 3. "Ai, quebrou uma unha... e a sua esperança!" / "Oh, I broke a nail... and your hope!" |

### Chefes

| id | Pintura e personalidade | Prompt de voz (Voice Design) | Falas únicas (PT-BR / EN) |
|---|---|---|---|
| `valentao` Valentão | (pintura igual à do Bruto) brutamontes tatuado, charuto, intimidador | `Huge Brazilian brute, extremely deep growling threatening voice, short aggressive sentences, no humor` | 1. "Aqui quem manda sou eu e o meu truco!" / "I run this place, and so does my truco!" 2. "Tá olhando o quê? Joga logo!" / "What are you looking at? Play already!" 3. "Meu punho é mais forte que a sua carta!" / "My fist is stronger than your card!" |
| `cartomante` Cartomante | (pintura igual à da Beti) velas, bola de cristal, olhar enigmático | `Mysterious Brazilian woman, low whispery theatrical voice, slow hypnotic delivery, smug and all-knowing` | 1. "Eu vi esse seu truco antes de você nascer!" / "I saw this truco of yours before you were born!" 2. "As cartas falam, e hoje elas riem de você." / "The cards speak, and today they laugh at you." 3. "A vira tá escondida, mas o seu medo não!" / "The vira is hidden, but your fear is not!" |
| `juiz` Juiz | Sem pintura ainda; juiz idoso, severo, martelo | `Stern old Brazilian man in his 60s, strict authoritative courtroom voice, clipped and formal, dry sarcasm` | 1. "Ordem na mesa! Truco é coisa séria!" / "Order at the table! Truco is serious business!" 2. "Condenado a perder a mão." / "Sentenced to lose the hand." 3. "Silêncio! O martelo já decidiu." / "Silence! The gavel has decided." |
| `agiota` Agiota | Homem gordo de ~50, camisa estampada, charuto, maço de notas, olhar de lado; sorriso oleoso | `Heavyset Brazilian man in his 50s, greasy smug voice, slow and syrupy, cigar-roughened, sounds like he is counting money` | 1. "Perdeu a mão? Põe na conta, com juros!" / "Lost the hand? Put it on the tab, with interest!" 2. "Todo mundo me deve, até a sorte." / "Everybody owes me, even luck." 3. "Dinheiro não aceita desaforo, amigo." / "Money doesn't take disrespect, friend." |
| `tony` Tony | Policial de ~50, bigode, óculos aviador, distintivo "Polícia Civil", coldre. Linha-dura | `Brazilian police chief in his 50s, commanding loud gruff voice, mustache grumble, tough-guy deadpan, Rio accent` | 1. "Documentos, e a carta mais alta!" / "License, and your highest card!" 2. "Você tem o direito de blefar... eu tenho o de prender." / "You have the right to bluff... I have the right to arrest." 3. "Isso aqui é jogo limpo, ou eu fecho o boteco!" / "Clean game, or I shut down the bar!" |
| `stuart` Stuart | Professor de ~42, óculos, colete, gravata, livros de História, Matemática e Filosofia, joinha; nerd simpático | `Brazilian man in his early 40s, friendly nerdy professor voice, articulate and a bit excited, explaining with enthusiasm` | 1. "Pela matemática, você tem 12% de chance." / "Mathematically, you have a 12% chance." 2. "A filosofia ensina: quem blefa, aprende." / "Philosophy teaches: who bluffs, learns." 3. "Café, ideias e planos... e agora, um truco." / "Coffee, ideas and plans... and now, a truco." |
| `peter` Peter | Homem de ~40, barba, camisa havaiana, queixo na mão, olhar pensativo; calado, observador | `Brazilian man in his early 40s, low calm quiet voice, slow minimalist delivery, thoughtful and laid-back, almost murmuring` | 1. "Hmm... interessante." / "Hmm... interesting." 2. "Não preciso de sinal... eu sinto a sua mão." / "I need no signal... I feel your hand." 3. "Silêncio também é jogada." / "Silence is also a play." |
| `sortuda` Sortuda | Mulher de ~32, bandana vermelha, tatuagem de hibisco, ficha de cassino de espadas; sorriso de quem já ganhou | `Brazilian woman in her early 30s, playful lucky-charm voice, honeyed and teasing, giggly with a wink in the tone` | 1. "Sorte? Não, é talento... com um pouquinho de sorte." / "Luck? No, it's talent... with a little luck." 2. "Hoje a manilha é minha, eu já sei." / "Today the manilha is mine, I just know." 3. "Sopra a ficha que dá sorte!" / "Blow on the chip, it brings luck!" |
| `reiDoTruco` Rei do Truco | Homem de ~65, terno risca de giz, charuto, anéis com coroa, relógio de ouro; chefão do bar | `Legendary old Brazilian card-player in his 60s, rich warm confident voice, theatrical godfather gravitas, slow and amused` | 1. "Eu era rei antes de vocês nascerem." / "I was king before you were born." 2. "A coroa não cai, só muda de cabeça... e hoje é a minha." / "The crown never falls, it only changes heads... and today it's mine." 3. "Respeito se conquista, truco se cobra." / "Respect is earned, truco is collected." |

Novos prompts (EN) para a coluna de voz serão registrados também em `art-src/elevenlabs/vo/_design/<id>.txt` na geração, para o histórico exato do que foi enviado.

## 6. Música: 3 temas novos em loop (`music.table2` a `music.table4`)

Prefixo comum (`MUSIC_COMMON` atual troca "countryside bar" por cada cena): `instrumental, no vocals, seamless loop, upbeat but relaxed card-game table background, mid-tempo so it never fights the voice lines`. Duração 60 s, loop com crossfade pelo `audio-normalize.ts` (−18 LUFS), modelo `music_v2_5`.

| Chave | Cena | Prompt |
|---|---|---|
| `music.table2` | Miami Beach ao pôr do sol | `sunset Miami Beach lounge, synthwave-tinged tropical house, warm analog pads, soft electric piano, chill groove at 100 bpm, palm trees and neon, retro-80s sunshine` |
| `music.table3` | Havaí e cassino | `Hawaiian casino lounge, slack-key guitar and ukulele with vibraphone and upright bass, brushed drums, smoky jazz-lounge swing at 96 bpm, ocean breeze, poker night` |
| `music.table4` | Bar paulista de fim de tarde | `Sao Paulo bar at golden hour, samba-rock with cavaquinho, nylon guitar, 7-string guitar bass runs, light pandeiro and tamborim, cozy beer-table groove at 104 bpm` |

Mapeamento no jogo: o `src/core/music.ts` sorteia entre `music.table` e as três novas a cada mesa (sem repetir a anterior); chefes seguem em `music.boss`.

## 7. Orçamento de créditos

**Custo real (2026-10-28):** ~14.500 créditos para a opção A completa com as 3 músicas (dentro da estimativa baixa–alta abaixo); o piloto do Bruto (44 takes) custou 168. Nenhuma regravação depois da checagem. O texto a seguir é o plano original, mantido como histórico.

**Não foi possível ler o saldo hoje.** A `ELEVENLABS_API_KEY` do `.env` foi rejeitada pela API (`401`/`400 invalid_api_key`): a mensagem diz que o valor colado é o **ID da chave**, e a chave válida começa com `sk_` e só aparece na criação. É preciso gerar uma chave nova e colocá-la no `.env` (permissões: Text to Speech, Voice Design, Music, Sound Generation, Voices, `user_read` para o saldo). Último saldo conhecido no repo: **18.891 créditos em 2026-09-30** (ciclo daquela data), que não vale mais sem checar.

Taxas medidas em [audio.md](audio.md): voz ≈ 10–19 créditos por take curto (6 personagens: 1.017 e 1.935 créditos para 17 takes + design); música 750 (`music.king`, 60 s) a 2.070 créditos (75 s).

| Item | Quantidade | Estimativa baixa | Estimativa alta |
|---|---|---|---|
| Voice Design | 19 | 600 | 1.000 |
| Falas padrão (8 × 2 línguas × 2 takes) | 19 × 32 = 608 takes | 6.100 | 11.500 |
| Falas únicas (3 × 2 línguas × 2 takes) | 19 × 12 = 228 takes | 2.300 | 4.300 |
| Música (3 × 60 s) | 3 | 2.250 | 4.970 |
| Regravações (~10% de takes ruins) | | 900 | 1.700 |
| **Total** | | **≈ 12.150** | **≈ 23.470** |

Opções para caber no saldo (a decidir com o saldo real em mãos):

- **A. Completo:** 2 takes por fala (tabela acima).
- **B. Enxuto (recomendado se o saldo for < 20 mil):** 1 take nas 3 falas únicas e 2 takes só nas padrão `truco/seis/nove/doze`; 570 takes no lugar de 836; total ≈ 9.200–18.500.
- **C. Em etapas:** 1ª rodada só PT-BR + músicas (≈ 7.000–13.000), 2ª rodada EN depois do próximo ciclo de créditos.

## 8. Tamanho e carregamento

**Como ficou (2026-10-28):** vozes PT 5,90 MB e EN 5,56 MB (418 arquivos cada), músicas novas 0,66 MB cada. Só as vozes do idioma ativo baixam, todas depois da primeira tela, junto de `music.table2`–`4` (`src/data/load-order.ts`); trocar o idioma nas Configurações baixa as da outra língua (`loadVoices`). Primeiro download medido: 6,12 MB em PT e em EN (assets 4,19 MB + código 1,94 MB). O build Poki não leva vozes nem as 3 músicas novas (a demo web completa leva tudo no carregamento tardio). As vozes antigas (`vo.<id>.*`, 271 arquivos, 2,6 MB) foram apagadas. Plano original:

`public/assets/audio` tinha 8,5 MB (audio.md). Os novos 836 takes (mono 64 kbps, ~0,8–1,5 s) somam ≈ 6–9 MB e as 3 músicas ≈ 2–3 MB (≈ 1 MB cada). Para não estourar os 8 MB do download inicial (GD-017):

- carregar **só a pasta do idioma ativo**, no `LATER` do `BootScene`; trocar de idioma baixa a outra pasta sob demanda;
- no build Poki e na demo, só as falas padrão do elenco jogável; o resto no `LATER`;
- as vozes antigas (`caiu`, `oloco`, 17 takes por personagem) saem do repo depois da migração, o que devolve cerca de 3,6 MB.

## 9. Ordem de execução (depois da confirmação)

1. Chave `sk_…` válida no `.env` e leitura do saldo (`/v1/user/subscription`).
2. Escolha da opção A, B ou C (seção 7).
3. Piloto: 1 personagem (Bruto) nas duas línguas, para o dev ouvir e aprovar o sotaque do inglês e as audio tags (~700 créditos).
4. Lote das 19 vozes (`bun scripts/el-voices.ts --lang pt|en [id …]`, a estender) e das 3 músicas (`bun scripts/el-music.ts music.table2 …`).
5. `audio-normalize.ts` (vozes −16, música −18 LUFS), medir com `--report`.
6. Integração no código (seção 3), testes, `docs/audio.md` atualizado com custos reais, CHANGELOG.
7. Escuta humana dos takes e regravação dos ruins (apague o bruto para refazer só aquele take).

## 10. Renomeio dos ids (apelido → nome real)

Em 2026-10-28 todos os ids de personagem, arquivos e chaves passaram a usar o nome real. Os ids de chefe que são títulos (`valentao`, `cartomante`, `juiz`, `agiota`, `sortuda`, `reiDoTruco`) e `ze` ficam como estavam.

| Antes | Agora | Antes | Agora |
|---|---|---|---|
| `tonhao` | `bruto` | `bia` | `mia` |
| `donaCida` | `cida` | `professor` | `stuart` |
| `zeMalandro` | `jhony` | `mudo` | `peter` |
| `juninho` | `nino` | `delegado` | `tony` |
| `joca` | `chico` | `lurdes` | `beti` |
| `tiao` | `ayla` | `neide` | `sheila` |

Também mudaram os feats `comTonhao`, `comDonaCida` e `comJuninho` (`comBruto`, `comCida`, `comNino`) e a constante `DELEGADO_CORRIDA_X` (`TONY_CORRIDA_X`). Os 393 arquivos (`vo.<id>.*`, `card/`, `portrait/`, `art-src/`) foram movidos com `git mv`. O save subiu para a versão 2: a migração `MIGRATIONS[1]` (`src/logic/save.ts`) troca os ids antigos em qualquer string e chave do save e da run em andamento (teste em `tests/save-compat.test.ts`). **Steam:** os nomes de API das conquistas seguem os ids dos feats; crie `comBruto`, `comCida`, `comNino`, `stuart`, `peter` e `tony` no Steamworks antes de publicar (`docs/steam-achievements.md`).
