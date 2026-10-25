---
name: game-art-assets
description: Use when creating, regenerating or replacing any visual asset of Zapatro (Truco Roguelite) — card faces and backs, card modifiers, portraits and expressions, bosses, Manha/Simpatia/Lance icons, packs, table and backgrounds, UI (buttons, panels, chips, signals), app icon or key art — with PixelLab or drawn by code, or when touching public/assets/gfx, art-src/, scripts/pl-*.ts, scripts/assets-*.ts or src/art/*. Keeps the file contract the game loads and the Style Bible (PLAN §6–7).
---

# game-art-assets

Fonte da verdade: **[docs/visual.md](../../../docs/visual.md)** (contrato, tamanhos, pipeline, custos, armadilhas) e **[docs/asset-status.md](../../../docs/asset-status.md)** (chave a chave). Estilo: PLAN §6 (Style Bible); chaves: PLAN §7.2 (status em `docs/asset-status.md`).

> **Art Bible v2 (2026-10-24):** os personagens que já têm `references/concept-art/zapatro/char-*.png` **não** vão ao PixelLab; convertem-se com `bun scripts/portraits.ts`. PixelLab só para o que falta (ex.: O Mudo, `art-src/portrait/mudo.png`, com `juiz.png` como `style_image_base64`). Fonte da verdade: [docs/visual.md](../../../docs/visual.md) (v2); referências a `docs/asset-status.md`, contrato 9-slice e tamanhos antigos abaixo valem só na branch `pixel-art`.

## Regras

- **Telas inteiras** (menu, salas da mesa, loja, baralho, Configurações) vêm de concept art vetorizado (pixels2svg), não do PixelLab: skill `svg-concept-art`. PixelLab fica para cartas, retratos, ícones, chefes e pacotes.
- **Onde:** toda geração vive na worktree `../jogo-truco-assets` (branch `assets`, PLAN §12.1). Antes de cada lote: `git merge dev` (pega chaves novas de `src/data/`). O fio principal integra com `git merge assets` em `dev` depois dos gates.
- **Contrato:** o jogo lê `public/assets/gfx/index.json` (`images`); `tex(scene, key)` desenha placeholder por código para qualquer chave ausente. Só entra no índice o que existe no disco. Cartas 48×64, retratos/ícones 48×48, chefes 96×96, fundos 640×360; alpha só 0/255.
- **Referência:** presskit do Balatro em `references/` só para princípios (legibilidade, hierarquia, juice). Nunca copiar arte, logo, fonte, layout ou paleta. Identidade: boteco do interior paulista.
- **Custo:** `bun scripts/pl-truco.ts --plan` mostra o que falta e quanto custa (sem `--plan`, gasta). Confira o saldo (`mcp__pixellab__get_balance`) antes de cada lote; lote acima de ~15% do saldo restante → pare e pergunte. Registre o custo por categoria em `docs/visual.md`.
- **Aprovação:** a carta âncora (3♣, zap) e o verso precisam de aprovação do usuário antes do lote completo das faces (A1.2).
- **Segredos:** `PIXELLAB_API_TOKEN` só no `.env` do checkout principal; nunca imprimir nem commitar.

## Fluxo

1. `bun scripts/pl-truco.ts --plan [--tier 1|2] [--only <prefixo>]` → `bun scripts/pl-truco.ts [--edits] [--reserve 40]`.
2. Escolher candidatos em `art-src/pixellab/picks.json` (reprovado → `raw/_rejected/`).
3. `bun scripts/assets-build.ts` → `public/assets/gfx/**` + `index.json` (+ `art-src/app-icon.png`; no fio principal, `bun run app-icons`).
4. `bun scripts/assets-validate.ts` e `bun scripts/assets-status.ts`.
5. Ver na mesa: `bunx --bun vite --port 5192 --strictPort` + `bun scripts/shot.ts --url http://localhost:5192 --out <scratch> table signals end`.
6. Atualizar `docs/asset-status.md` e `docs/visual.md`; commit na branch `assets` (sem push; o fio principal integra).

## Do lado do jogo (fio principal)

- Chave nova usada pela cena → placeholder em `src/art/placeholders.ts` (padrão de chave) e linha em PLAN §7.2.
- Modo 4 cores: `TableScene.cardKey` prefere `card.<rank>.<suit>.4c` quando a textura existe; sem ela, o placeholder desenha a variante.
