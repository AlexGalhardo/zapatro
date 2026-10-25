# Áudio

Todo o áudio é gerado no **ElevenLabs** na worktree de assets (PLAN §8, §12.1). Catálogo único: `scripts/el-catalog.ts` (`AUDIO`, `VOICES`, `VO_LINES`). Mapeamento no jogo: `src/data/sfx.ts` e `src/core/music.ts` (fio principal).

## Pipeline

1. `bun scripts/el-sfx.ts [--tier 1|2] [prefixo …]` — efeitos, UI e ambiências (`eleven_text_to_sound_v2`; ambiências com `loop`). **Não tem `--help`: qualquer execução gera o que falta.**
2. `bun scripts/el-music.ts [--tier 1|2] [chave …]` — música instrumental (`music_v2_5`).
3. `bun scripts/el-voices.ts [personagem …]` — falas PT-BR: desenha a voz a partir da descrição em `VOICES` (Voice Design `eleven_ttv_v3`, amostra em `art-src/elevenlabs/vo/_design/<char>.mp3`), fala cada linha com `eleven_v4` (Text to Dialogue, uma audio tag por take: `[shouting]`, `[excited]`…) e apaga a voz no fim para liberar o slot.
4. `FFMPEG=C:/Users/aleex/scoop/shims/ffmpeg.exe bun scripts/audio-normalize.ts [--report]` — corta silêncio, mono, alvo EBU R128: efeitos e vozes −16, UI −20, música −18, ambiência −30 LUFS; limite −1 dBFS. Música ≥ 30 s vira loop com crossfade.

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
| `amb.botecoBairro` | ambiência |

Tier 2 (prontos): `music.king` (final do Rei do Truco, 60 s em loop) e uma ambiência por Campeonato, `amb.<botecoBairro|barDeEstrada|quermesse|clube|festaDoPeao|regional|estadual|reiDoTruco>` (30 s, loop, −30 LUFS).

## Vozes (`vo.<char>.<linha>`, tier 2)

Linhas: `truco` (3 takes), `seis`, `nove`, `doze`, `bora`, `corre`, `caiu`, `oloco` (2 takes cada). Arquivos em `public/assets/audio/sfx/vo.<char>.<linha>(.<n>).mp3`, −16 LUFS, mono 64 kbps.

| Personagem | Estado |
|---|---|
| `tonhao`, `donaCida`, `ze`, `bia`, `joca`, `lurdes`, `tiao`, `neide` (a mesa atual) | prontos (17 takes cada) |
| `zeMalandro` | pronto |
| `juninho` | `oloco` fica com 1 take (decisão 2026-10-25): o Voice Design da ElevenLabs agora recusa a descrição "brazilian teenage boy, 16 years old" (403 `blocked_generation`, request `76973d7a5e0a93354a4ea7d3a532f86d`), e outra descrição daria outra voz. Regravar as falas dele só se a voz mudar |
| chefes `valentao`, `cartomante`, `juiz`, `agiota`, `delegado`, `reiDoTruco` | prontos (17 takes cada) |

No jogo: `voice(scene, char, line)` (`src/core/audio.ts`; `VO_LINES`/`VO_DEF` em `src/data/sfx.ts`). A mesa toca `truco`/`seis`/`nove`/`doze` no pedido, `bora` ao aceitar e `corre` ao correr, junto dos balões `say.*`; `caiu` toca quando os rivais levam a mão e `oloco` quando a sua dupla leva com 6 tentos ou mais (evento `handOver`).

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

Sessão 2026-09-30: **24.160 → 22.819**, depois **22.801 → 18.891** no lote do tier 2 (créditos restantes no ciclo).

**Orçamento web:** `public/assets/audio` tem **8,5 MB** (música + ambiências 5,1 MB, efeitos + vozes 3,6 MB), acima do limite de 8 MB do download inicial do Poki (PLAN §9). Desde 2026-10-25 (GD-017) o `BootScene` só carrega antes do menu o que a primeira mesa usa; as ambiências dos Campeonatos 2–8, `music.king` e as vozes dos chefes (`LATER` em `src/scenes/BootScene.ts`) baixam em segundo plano depois que o menu abre (o `Boot` continua ativo, sem nada na tela). Medido no `vite preview` do build de produção: **6,6 MB até o menu**, 10,0 MB no total, 0 falhas de rede; build Poki (`bun run build:poki`) com 5,1 MB.

## Auditoria objetiva (2026-10-25, GD-018)

Sem saída de som na sessão, a mixagem foi medida em vez de ouvida (`ffmpeg` `ebur128` e `volumedetect` nos 317 arquivos de `public/assets/audio`):

- Músicas −18,4 LUFS (alvo −18) e ambiências −30,0 a −30,9 LUFS (alvo −30): todas no alvo. Efeitos e vozes com mais de 0,4 s no alvo ±2 LU (exceção: `vo.ze.oloco.2` a −13,8); os mais curtos que 0,4 s leem −70 na medida integrada por causa do bloco de 400 ms do EBU R128, e o volume médio deles fica entre −16 e −23 dB, coerente com o alvo.
- Emendas de loop: salto de amostra ≤ 0,04 da escala cheia em todas as músicas e ambiências (sem estalo). `amb.reiDoTruco` tinha as pontas em fade (−83 dB) e mergulhava em silêncio a cada 30 s: o normalizador agora apara o silêncio das ambiências antes do crossfade de 2 s, e a emenda ficou em −20/−30 dB, sem mergulho.
- 22 efeitos curtos têm pico decodificado de 0,0 dBFS: o limitador trabalha em −1 dBFS no WAV e o encoder MP3 passa um pouco disso em transientes de menos de 0,4 s. Testado e revertido: travar o ganho pelo pico decodificado deixava um take do `sfx.truco` 4 LU mais baixo que o outro, o que se ouve; o pico de encoder nessas durações não se ouve.
- Falta a escuta humana de 15 minutos (`docs/quality-assurance-functional-systems-global-test.md`).

## Pendências

- Resolvido: `sfx.score.xmult` agora é o tinido sustentado de duas garrafas (bruto −10 LUFS; o tilintar curto de copos media −40). `amb.reiDoTruco` refeita (a versão "silenciosa" media −46 LUFS).

- `vo.juninho.oloco.2`: não será gerado (ver tabela de vozes).
- Tier 2 da revisão do diretor no catálogo (`scripts/el-catalog.ts`), ainda não gerados: `sfx.joker.spin`, `sfx.boss.intro`, `sfx.eleven.enter`, `sfx.iron.enter`, `sfx.feat.unlock`, `sfx.ui.toggle`, `sfx.ui.slider` (aparar para 0,15 s e 0,08 s depois de normalizar), `sfx.promise`, `music.shop`, `amb.decisive`; vozes `onze`/`ferro` (14 × 2) ficam para depois. Gerar com `bun scripts/el-sfx.ts --tier 2 <prefixo>` e `bun scripts/el-music.ts`.
- O `el-sfx.ts` acrescenta "no music" ao prompt: prompts com instrumento melódico (xilofone, sino) saem como clique e ruído; descreva como foley (blocos de madeira, taça).
- `sfx.ui.error` bruto a −26 LUFS (ok depois de normalizado).
