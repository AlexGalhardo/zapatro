---
name: game-art-assets
description: Use when creating, regenerating or replacing any visual asset of Zapatro (Truco Roguelite) — painted character cards and busts, bosses, painted backgrounds, card backs, joker and special card faces, card faces and modifiers drawn by code, UI icons, signal icons, app icon or key art — or when touching public/assets/gfx, art-src/, scripts/portraits.ts, scripts/icons.ts or src/art/*. Keeps the file contract the game loads and the Art Bible v3 (docs/visual.md §0).
---

# game-art-assets

Fonte da verdade: **[docs/visual.md](../../../docs/visual.md) §0 (Art Bible v3, 2026-10-27)**. O resto do `visual.md` é a base v2 (layout, medidas e cores da UI). `docs/asset-status.md` é histórico da linha em pixel.

## O que é cada coisa

| Asset | Técnica | Origem → arquivo | Chave |
|---|---|---|---|
| Personagens (elenco, Zé, Sortuda, Rei do Truco) | pintura | `art-src/gta/char-*` → `public/assets/gfx/card/<id>.webp` (480×640, 3:4) e `portrait/<id>.webp` (256×256) | `charcard.<id>`, `portrait.<id>.<expr>` (um retrato só; `<expr>` é ignorado) |
| Chefes sem pintura (8) | pixel 128×128 (legado) | `public/assets/gfx/portrait/<id>.png` | idem; trocar por pintura é pendência (BUGS M-16) |
| Fundos | pintura 1920×1080 | `art-src/gta/*` → `bg/{main,shop,partner,table,menu-1..3}.webp` | `img.bg.<nome>`; telas usam `setBackdrop` |
| Versos, coringa, especiais | pintura inteira 2:3 | `art-src/gta/card-*` → `back/<nome>.webp` | `img.back.<nome>`, desenhados por `drawBack`/`paintedFace` |
| Cartas comuns, modificadores, painéis, botões | vetor por código | `src/art/flat.ts` | `card.<rank>.<suit>` (`.m` e `.z` com moldura), `card.mod.*` |
| Ícones de UI | pixel (folha) ou vetor | `ui-icons.png` → `bun scripts/icons.ts` → `icon/*.png`; o resto em `src/art/icons.ts` | `icon.<nome>` |
| Sinais secretos | emoji Unicode | `SIGNAL_EMOJI` em `src/data/characters.ts` | o mesmo mapa no manual, na escolha, na mesa e no aviso de truco |
| Ícone do app | vetor | `art-src/app-icon.svg` → `bun run app-icons` | — |

## Regras

- **Pintura nova:** mesmo estilo e enquadramento de `art-src/gta/` (verão, pôr do sol), **sem texto, logo ou marca real** dentro da imagem (lista de pendências em BUGS M-15/M-18). Salve o original em `art-src/gta/` e rode `bun scripts/portraits.ts` (local, sem rede; gera os WebP e o `public/assets/gfx/index.json`).
- **Nunca** gere personagem do elenco no PixelLab nem volte ao pixel: os pixel antigos ficam só em `art-src/backup-pixel/`.
- **Peso:** imagem que a primeira tela não usa entra no `LATER` do `BootScene` (primeiro download web < 8 MB, GD-017). Meça com o build de produção antes de commitar.
- **Fallback:** toda chave tem desenho de reserva em `flat.ts`; quando o bitmap chega, `registerPortraits` redesenha a textura no lugar. Não crie chave que só funcione com a imagem.
- **Cores** novas só em `src/config/palette.ts`; nada de hex solto em `src/art`.
- **Referência:** presskits de terceiros só para princípios (legibilidade, hierarquia, "juice"). Nunca copiar arte, logo, fonte, layout ou paleta.
- **Segredos:** `PIXELLAB_API_TOKEN` e `ELEVENLABS_API_KEY` só no `.env`; nunca imprimir nem commitar.

## Fluxo

1. Original em `art-src/gta/` (ou ícone em `art-src/`).
2. `bun scripts/portraits.ts` (pinturas) ou `bun scripts/icons.ts` (folha de ícones).
3. Reinicie o Vite se a lista de arquivos de `public/` mudou; confira em 1920×1080 e 2560×1440 (`bun scripts/gta-shots.ts` tira antes/depois).
4. `bun run build` e meça o primeiro download; `bun run check`, `bun run typecheck`, `bun test`.
5. Atualize `docs/visual.md` §0 (tabela), CHANGELOG `[Unreleased]` e, se for pendência resolvida, o checklist do PLAN §1.4.4.
