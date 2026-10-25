# Resoluções de monitor dos jogadores da Steam (alvo do build desktop)

Pesquisa de 2026-09-29 no **Steam Hardware & Software Survey de agosto de 2026** (resolução do monitor principal). A lista vira o conjunto de QA desktop (`scripts/lib/devices.ts` → `STEAM_DISPLAYS`, rodado por `bun scripts/qa-devices.ts --set desktop`).

## Top 10 + Steam Deck

| # | Resolução | Proporção | Participação | Variação no mês | Zoom do jogo → área lógica |
|---|---|---|---|---|---|
| 1 | 1920×1080 | 16:9 | **50,52%** | −0,58 | ×3 → 640×360 |
| 2 | 2560×1440 | 16:9 | **21,86%** | +0,40 | ×4 → 640×360 |
| 3 | 2560×1600 | 16:10 | 5,71% | +0,61 | ×4 → 640×400 |
| 4 | 3840×2160 | 16:9 (4K) | 4,98% | +0,03 | ×6 → 640×360 |
| 5 | 3440×1440 | 21:9 ultrawide | 3,14% | 0,00 | ×4 → 860×360 |
| 6 | 1920×1200 | 16:10 | 2,76% | +0,11 | ×3 → 640×400 |
| 7 | 1366×768 | ~16:9 (notebook) | 2,23% | −0,23 | ×2 → 683×384 |
| 8 | 1440×900 | 16:10 | 0,73% | −0,05 | ×2 → 720×450 |
| 9 | 1600×900 | 16:9 | 0,67% | −0,03 | ×2 → 800×450 |
| 10 | 2560×1080 | 21:9 ultrawide | 0,67% | −0,02 | ×3 → 853×360 |
| + | 1280×800 (Steam Deck) | 16:10 | 0,31% (+0,49% em 800×1280, o painel do Deck) | — | ×2 → 640×400 |

"Outras" somam 3,26%. As 10 primeiras cobrem **~93%** dos jogadores.

## O que isso significa

- **1080p e 1440p são 72%** dos jogadores: 640×360 lógicos com zoom inteiro (×3 e ×4), exatamente a resolução de desenho do jogo. Nada a ajustar.
- **16:10 (2560×1600, 1920×1200, 1440×900, Steam Deck) soma ~9,5%:** a área ganha altura (400–450 lógicos); o layout tem de centralizar sem buracos. Verificado no QA.
- **Ultrawide (3440×1440, 2560×1080) soma ~3,8%:** o palco 16:9 (640×360 lógicos) fica centralizado e as barras laterais são neutras (`#2B2B2B`), sem mostrar mais mundo nas laterais. Esse fundo neutro é a identidade do visual; feltro largo fica como possível melhoria futura. Verificado no QA.
- **4K (5%):** zoom ×6, pixel art nítida; o custo é só de fill rate da GPU.
- **1366×768 (2,2%):** notebooks fracos, zoom ×2 com 683×384 lógicos; é o piso de desempenho do desktop.
- **Steam Deck:** 1280×800 com zoom ×2 (640×400). Controle, texto legível a ~30 cm e FPS estável são os critérios do selo "Verificado"; o jogo já suporta gamepad.
- O build Electron abre em janela de 1280×720 (mín. 960×540) e vai para tela cheia com F11; em tela cheia vale a resolução do monitor acima.

## Como testar

```bash
bun run dev                                                     # outro terminal
bun scripts/qa-devices.ts --set desktop --url http://localhost:5191   # 11 resoluções, 5 telas cada
bun scripts/qa-devices.ts --set desktop --only uw1440,steam-deck game
```

Saída em `qa-devices/desktop/<resolução>/*.png` + `index.md` (gitignored). Resultado em 2026-09-29: 11/11 sem erros no console, menus e HUD corretos em 16:9, 16:10, 21:9 e 4K.

## Fonte

- [Steam Hardware & Software Survey — agosto de 2026](https://store.steampowered.com/hwsurvey/Steam-Hardware-Software-Survey-Welcome-to-Steam) (Primary Display Resolution)
