# Áudio

Todo o áudio é gerado no **ElevenLabs** na worktree de assets (PLAN §8, §12.1). Catálogo único: `scripts/el-catalog.ts` (`AUDIO`, `VOICES`, `VO_LINES`). Mapeamento no jogo: `src/data/sfx.ts` e `src/core/music.ts` (fio principal).

## Pipeline

1. `bun scripts/el-sfx.ts [--tier 1|2] [prefixo …]` — efeitos, UI e ambiências (`eleven_text_to_sound_v2`; ambiências com `loop`). **Não tem `--help`: qualquer execução gera o que falta.**
2. `bun scripts/el-music.ts [--tier 1|2] [chave …]` — música instrumental (`music_v2_5`).
3. `bun --use-system-ca scripts/el-voices.ts [personagem …]` — falas PT e EN (a flag é obrigatória nesta máquina: sem ela o Bun falha com `SELF_SIGNED_CERT_IN_CHAIN`; nunca desligue a verificação TLS): desenha a voz a partir da descrição em `VOICES` (Voice Design `eleven_ttv_v3`, amostra em `art-src/elevenlabs/vo/_design/<char>.mp3`), fala cada linha com `eleven_v4` (Text to Dialogue, uma audio tag por take: `[shouting]`, `[excited]`…) e apaga a voz no fim para liberar o slot.
4. `FFMPEG=C:/Users/aleex/scoop/shims/ffmpeg.exe bun scripts/audio-normalize.ts [--report]` — corta silêncio, mono, alvo EBU R128: efeitos e vozes −16, UI −20, música −18, ambiência −30 LUFS; limite −1 dBFS. Música ≥ 30 s vira loop com crossfade.
5. `FFMPEG=C:/Users/aleex/scoop/shims/ffmpeg.exe bun scripts/audio-check.ts [prefixo …]` — confere toda voz e música do catálogo: arquivo existe e decodifica como MP3 (ffprobe), duração plausível (voz 0,3–8 s, música a duração do catálogo ±25 %), não vazio, loudness no alvo ±2 LU (medido em laço de 3 s, como o normalizador), pico ≤ −0,5 dBFS decodificado (limitador em −1; o MP3 passa uns décimos), sem clipping, sem silêncio de 1 s no meio (3 s na música), takes idênticos, emenda de loop das músicas e o tamanho por idioma e do primeiro download (< 8 MB). Sai com código ≠ 0 se algo falhar. Não transcreve: o conteúdo falado não é conferido.

Brutos resumíveis em `art-src/elevenlabs/<kind>/<chave>/<n>.mp3` (apague o bruto para refazer um take). Saída: `public/assets/audio/sfx/<chave>.mp3` (+ `<chave>.<n>.mp3` por take) e `public/assets/audio/music/<chave>.mp3`. Log: `art-src/elevenlabs/log.jsonl`. Chave `ELEVENLABS_API_KEY` só no `.env` do checkout principal (lida por `scripts/pl-env.ts`); nunca imprimir.

## Chaves da mesa (tier 1, todas prontas)

| Chave | Uso |
|---|---|
| `sfx.card.shuffle` / `.deal` (2) / `.play` (2) / `.flip` | baralho |
| `sfx.trick.win` | vaza ganha |
| `sfx.truco` (2), `sfx.bet.accept`, `sfx.bet.run` | aposta |
| `sfx.signal`, `sfx.signal.caught` | sinais |
| `sfx.card.cover`, `sfx.zap.reveal`, `sfx.bet.doze`, `sfx.queda`, `sfx.hand.lose` | carta encoberta, banner do ZAP, aposta chega a 12, Lance Queda da sua dupla, mão perdida sem pontos (revisão do diretor 2026-10-25 §8) |
| `sfx.table.win` / `.lose` | fim da partida |
| `sfx.score.chip` / `.mult` / `.xmult`, `sfx.money`, `sfx.manha.trigger` | pontuação |
| `sfx.shop.buy` / `.reroll`, `sfx.pack.open`, `sfx.ui.move` / `.confirm` / `.back` / `.error` | loja e interface |
| `music.menu`, `music.table`, `music.boss`, `music.win`, `music.lose` | música (`win`/`lose` são vinhetas de 10–12 s, sem loop) |
| `music.table2`, `music.table3`, `music.table4` | loops de mesa de 58 s (lote 1.0): a mesa normal sorteia entre `music.table` e estes três a cada mesa, sem repetir a anterior (`tableMusic` em `src/core/music.ts`, só entre os já carregados); chefes seguem em `music.boss`/`music.king` |
| `amb.botecoBairro` | ambiência |

Tier 2 (prontos): `music.king` (final do Rei do Truco, 60 s em loop) e uma ambiência por Campeonato, `amb.<botecoBairro|barDeEstrada|quermesse|clube|festaDoPeao|regional|estadual|reiDoTruco>` (30 s, loop, −30 LUFS).

## Vozes (`vo.<lang>.<char>.<linha>`, lote final 1.0)

Uma voz por personagem fala os dois idiomas: `pt` (português) e `en` (inglês). Arquivos em `public/assets/audio/sfx/vo.<lang>.<char>.<linha>.mp3` (+ `.2.mp3` para o 2º take), −16 LUFS, mono 64 kbps; brutos em `art-src/elevenlabs/vo/vo.<lang>.<char>.<linha>/<n>.mp3`. Textos em `scripts/el-catalog.ts` (`VO_LINES`, `VO_JOKES`) e em [audio-final-game.md](audio-final-game.md).

| Linha | PT / EN | Quando toca na mesa |
|---|---|---|
| `truco`, `seis`, `nove`, `doze` | "TRUCO!", "SEIS!", "NOVE!", "DOZE!" / "TRUCO!", "SIX!", "NINE!", "TWELVE!" | no pedido (evento `truco`) |
| `bora`, `ver` | "Bora!", "Quero ver!" / "Let's go!", "Show me!" | ao aceitar, sorteio meio a meio |
| `corre` | "Tô fora!" / "I'm out!" | ao correr de truco (3) |
| `sacanagem` | "Tá de sacanagem comigo!" / "You're kidding me!" | ao correr de pedido de 6 ou mais (`VO_SACANAGEM_BET`) |
| `piada1`–`piada3` | três piadas próprias de cada personagem | momento calmo: no começo da mão normal, no máximo 1 a cada 3 mãos e com 50 % de chance (`VO_JOKE`), 1,8 s depois da distribuição, por um NPC sorteado, nunca a mesma piada que ele contou por último, nunca por cima de outra fala nem de um balão; só a voz, sem balão |

Personagens (19, todos com as 11 linhas × 2 takes × 2 idiomas = 44 arquivos): 10 companheiros `bruto`, `cida`, `jhony`, `nino`, `ze`, `mia`, `chico`, `beti`, `ayla`, `sheila`; 9 chefes `valentao`, `cartomante`, `juiz`, `agiota`, `tony`, `stuart`, `peter`, `sortuda`, `reiDoTruco`. Total: 836 arquivos (418 por idioma).

No jogo: `voice(scene, char, line)` (`src/core/audio.ts`) monta a chave pelo idioma das Configurações (`voLang`/`voKey` em `src/logic/voice-lines.ts`: `pt-BR` → `pt`, `en` → `en`), sorteia o take e devolve se tocou; `voiceBusy()` diz se uma fala ainda toca. A escolha das linhas (`acceptLine`, `foldLine`, `jokeDue`, `nextJoke`) é lógica pura em `src/logic/voice-lines.ts`, com os números em `src/data/sfx.ts`. As antigas linhas `caiu` e `oloco` (e os arquivos `vo.<char>.*` sem idioma) saíram do jogo.

**Carregamento:** só as vozes do idioma ativo baixam, todas depois que a primeira tela abre (`loadPhase` em `src/data/load-order.ts`); trocar o idioma nas Configurações (ou importar um save de outro idioma) chama `loadVoices` (`src/scenes/BootScene.ts`), que baixa as da outra língua pelo loader do `Boot`. Até chegar, a fala é silenciosa. O build Poki não leva vozes.

## Custos (ElevenLabs, créditos)

| Lote | Créditos |
|---|---|
| Música 75 s (`music.table`) | ~2.070 |
| Vinhetas `music.win` + `music.lose` (22 s) | ~275 |
| Vozes de 6 personagens (6 designs + 102 takes) | ~1.017 (~170 por personagem) |
| 5 takes de SFX refeitos | ~40 |
| `music.king` (60 s) | 750 |
| 7 ambiências de 30 s (+1 refeita) | ~1.400 (~200 cada) |
| Vozes dos 6 chefes | 1.935 (~320 por personagem) |
| Lote final 1.0: 19 vozes × 22 takes × 2 idiomas (836 takes) + `music.table2`/`3`/`4` (2026-10-28) | ~14.500 no total (o `bruto` sozinho, 44 takes, custou 168) |
| Regerações depois da checagem de 2026-10-28 | 0 (nenhum take reprovado) |

Sessão 2026-09-30: **24.160 → 22.819**, depois **22.801 → 18.891** no lote do tier 2 (créditos restantes no ciclo).

**Orçamento web:** o `BootScene` só carrega antes da primeira tela o que a primeira mesa usa (`loadPhase` em `src/data/load-order.ts`); as ambiências dos Campeonatos 2–8, `music.king`, `music.table2`–`4` e todas as vozes do idioma ativo baixam em segundo plano depois que a tela abre (o `Boot` continua ativo, sem nada na tela). Medido em 2026-10-28 (`scripts/audio-check.ts`, assets + código do `dist/`): **6,12 MB no primeiro download** em PT e em EN (assets 4,19 MB + código 1,94 MB); antes da integração, no `HEAD`, os assets do primeiro download somavam 5,96 MB (1,81 MB eram vozes dos companheiros). Vozes: 5,90 MB em PT, 5,56 MB em EN; músicas 5,08 MB. No navegador headless (dev server, `?skipMenu=1&auto=1`): 418 pedidos `vo.pt.*` e 0 `vo.en.*` em pt-BR (o inverso em en-US), 418 da outra língua depois de `loadVoices`, 0 respostas HTTP ≥ 400. Build Poki (`bun run build:poki`): sem vozes nem `music.table2`–`4` (`POKI_SKIP` no `vite.config.ts`), mas o `dist/` soma 8,20 MB, acima do limite de 8 MB que o `scripts/release.ts` cobra; a parte de áudio é a mesma do `HEAD` (2,87 MB), o excesso vem da arte (3,20 MB) e do código (1,83 MB).

## Auditoria objetiva (2026-10-25, GD-018)

Sem saída de som na sessão, a mixagem foi medida em vez de ouvida (`ffmpeg` `ebur128` e `volumedetect` nos 317 arquivos de `public/assets/audio`):

- Músicas −18,4 LUFS (alvo −18) e ambiências −30,0 a −30,9 LUFS (alvo −30): todas no alvo. Efeitos e vozes com mais de 0,4 s no alvo ±2 LU (exceção: `vo.ze.oloco.2` a −13,8); os mais curtos que 0,4 s leem −70 na medida integrada por causa do bloco de 400 ms do EBU R128, e o volume médio deles fica entre −16 e −23 dB, coerente com o alvo.
- Emendas de loop: salto de amostra ≤ 0,04 da escala cheia em todas as músicas e ambiências (sem estalo). `amb.reiDoTruco` tinha as pontas em fade (−83 dB) e mergulhava em silêncio a cada 30 s: o normalizador agora apara o silêncio das ambiências antes do crossfade de 2 s, e a emenda ficou em −20/−30 dB, sem mergulho.
- 22 efeitos curtos têm pico decodificado de 0,0 dBFS: o limitador trabalha em −1 dBFS no WAV e o encoder MP3 passa um pouco disso em transientes de menos de 0,4 s. Testado e revertido: travar o ganho pelo pico decodificado deixava um take do `sfx.truco` 4 LU mais baixo que o outro, o que se ouve; o pico de encoder nessas durações não se ouve.
- Falta a escuta humana de 15 minutos (`docs/quality-assurance-functional-systems-global-test.md`).

## Checagem do lote final (2026-10-28, `scripts/audio-check.ts`)

845 takes (836 vozes + 9 músicas; `music.shop` ainda não gerado), todos aprovados:

| Grupo | Takes | LUFS (mín / máx / média) | Pico dBFS (mín / máx) | Duração s (mín / máx / média) | Tamanho |
|---|---|---|---|---|---|
| `vo.pt` | 418 | −17,0 / −15,9 / −16,5 | −7,4 / −0,6 | 0,6 / 6,3 / 1,8 | 5,90 MB |
| `vo.en` | 418 | −17,5 / −16,1 / −16,5 | −7,6 / −0,5 | 0,6 / 7,0 / 1,7 | 5,56 MB |
| `music.*` | 9 | −18,5 / −18,4 / −18,4 | −6,7 / −2,7 | 10 / 73 / 49 | 5,08 MB |

- Nenhuma voz abaixo de 0,4 s (a mais curta tem 0,6 s), então a medida integrada vale para todas; nenhum take vazio, cortado, com erro de decodificação ou idêntico a outro.
- 48 takes têm pico decodificado entre −1 e −0,5 dBFS (encoder MP3 sobre o limitador de −1); nenhum clipping.
- O 2º take de `corre` tem um suspiro antes da fala (audio tag `[sighs]` do `el-voices.ts`), por isso dura ~1,9 s e tem uma pausa de ~0,25 s; é intencional.
- Emendas de loop (salto entre a última e a primeira amostra contra o maior passo da própria música nas 2.000 amostras de cada lado): `music.table2` 262, `music.table3` 1.963 (passo local 2.152), `music.table4` 201, todas abaixo do passo que a música já faz ali; sem estalo medido. Não foi verificado se o navegador aplica o atraso do encoder MP3 igual ao ffmpeg.
- Conteúdo falado **não verificado**: não há whisper/whisperx nesta máquina. O ritmo (letras por segundo) fica entre 2,5 e 15,7, sem take fora do padrão de fala.

## Pendências

- Resolvido: `sfx.score.xmult` agora é o tinido sustentado de duas garrafas (bruto −10 LUFS; o tilintar curto de copos media −40). `amb.reiDoTruco` refeita (a versão "silenciosa" media −46 LUFS).

- Tier 2 da revisão do diretor no catálogo (`scripts/el-catalog.ts`), ainda não gerados: `sfx.joker.spin`, `sfx.boss.intro`, `sfx.eleven.enter`, `sfx.iron.enter`, `sfx.feat.unlock`, `sfx.ui.toggle`, `sfx.ui.slider` (aparar para 0,15 s e 0,08 s depois de normalizar), `music.shop`, `amb.decisive`. Gerar com `bun scripts/el-sfx.ts --tier 2 <prefixo>` e `bun scripts/el-music.ts`.
- O `el-sfx.ts` acrescenta "no music" ao prompt: prompts com instrumento melódico (xilofone, sino) saem como clique e ruído; descreva como foley (blocos de madeira, taça).
- `sfx.ui.error` bruto a −26 LUFS (ok depois de normalizado).
