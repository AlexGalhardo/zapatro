---
name: game-audio-assets
description: Use when adding, mapping or replacing any sound, music or voice bark of Zapatro (Truco Roguelite): SFX keys and voice lines in src/data/sfx.ts, music in src/core/music.ts, files in public/assets/audio, generating audio with ElevenLabs via scripts/el-*.ts (catalog in scripts/el-catalog.ts), or normalizing loudness with scripts/audio-normalize.ts.
---

# game-audio-assets

Fonte da verdade: **[docs/audio.md](../../../docs/audio.md)** (pipeline, chaves da mesa, vozes, custos, pendências). Catálogo único: `scripts/el-catalog.ts` (`AUDIO`, `VOICES`, `VO_LINES`).

## Regras

- **Onde:** geração e normalização na worktree `../jogo-truco-assets` (branch `assets`); `git merge dev` antes de cada lote. O fio principal mapeia as chaves no jogo e integra com `git merge assets`.
- **Arquivos:** `public/assets/audio/sfx/<chave>.mp3` (+ `<chave>.<n>.mp3` por take) e `public/assets/audio/music/<chave>.mp3`. O `BootScene` carrega tudo o que existe; chave sem arquivo fica muda.
- **Loudness:** `bun scripts/audio-normalize.ts` (efeitos e vozes −16, UI −20, música −18, ambiência −30 LUFS; limite −1 dBFS).
- **Custo:** confira os créditos ElevenLabs antes de cada lote; lote acima de ~15% do saldo → pare e pergunte. Registre em `docs/audio.md`. `ELEVENLABS_API_KEY` só no `.env`; nunca imprimir.
- **Vozes:** `vo.<lang>.<char>.<linha>` (`<lang>` = `pt` | `en`) com as 11 linhas de `VO_LINES` (`truco`, `seis`, `nove`, `doze`, `bora`, `ver`, `corre`, `sacanagem`, `piada1`–`piada3`, 2 takes cada; textos em `scripts/el-catalog.ts`). Gerar com `bun --use-system-ca scripts/el-voices.ts <char>` (sem a flag o Bun falha com `SELF_SIGNED_CERT_IN_CHAIN`); conferir com `bun scripts/audio-check.ts vo.`. Regravar um personagem desenha outra voz: refaça todas as linhas dele juntas.

## Do lado do jogo (fio principal)

- Efeito novo: entrada em `SFX` (`src/data/sfx.ts`: bus, volume, vozes simultâneas, pitch, duração, takes) e `sfx(scene, key)` (`src/core/audio.ts`).
- Voz: `voice(scene, char, line)` (`src/core/audio.ts`, `VO_LINES`/`VO_DEF` em `src/data/sfx.ts`); a mesa toca `truco/seis/nove/doze`, `bora` (aceitou) e `corre` (correu) dos personagens IA.
- Música: `playMusic(scene, key)` / `duckMusic` (`src/core/music.ts`, `DUCK` em `src/data/sfx.ts`).
- Atualize a tabela evento → som em `docs/audio.md` (pela worktree `assets`) ou anote o pedido.
