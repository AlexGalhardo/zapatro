# Smartphones mais vendidos no Brasil (alvo do build Android)

Pesquisa de 2026-09-29 para decidir em que telas o jogo precisa funcionar bem. A lista vira o conjunto de QA mobile (`scripts/lib/devices.ts` → `BR_PHONES`, rodado por `bun scripts/qa-devices.ts --set mobile`).

## Mercado

- **1º semestre de 2026 (Counterpoint Research, via Mobile Time):** o mercado caiu 11% contra o 1S25 (preço de memória, menos produção nacional). **Samsung 42%** e **Motorola 31%** somam 73%; marcas chinesas (JOVI/vivo, HONOR, OPPO, realme) caíram de 26% para 20%. Os cinco modelos mais vendidos somaram 29% do mercado.
- **1º trimestre de 2026 (IDC, via ACIARA):** Samsung 46%, Motorola 21%, Xiaomi 15%, Oppo 8%, Apple 5%.
- **2025:** Galaxy A15, Redmi Note 13, Moto G84, iPhone 13 e POCO X6 lideraram as vendas no ano.

Conclusão para o jogo: o público brasileiro de Android é dominado por **aparelhos de entrada e intermediários Samsung e Motorola**, muitos com tela **HD+ (720 px de altura em paisagem)** e GPU modesta. O jogo tem de rodar liso em 720p e ficar legível em 6,5–6,9".

## Top 10 (últimos anos) e o aparelho de teste

| # | Aparelho | Fonte / período | Tela | Resolução (px físicos) | Taxa | Zoom do jogo → área lógica |
|---|---|---|---|---|---|---|
| 1 | Samsung Galaxy A07 4G | Counterpoint 1S26, 1º (8,3% do mercado) | 6,7" LCD | 720×1600 | 90 Hz | ×2 → 800×360 |
| 2 | Samsung Galaxy A17 4G | Counterpoint 1S26, 2º | 6,7" Super AMOLED | 1080×2340 | 90 Hz | ×3 → 780×360 |
| 3 | Motorola Moto G06 | Counterpoint 1S26, 3º | 6,88" LCD | 720×1640 | 120 Hz | ×2 → 820×360 |
| 4 | Motorola Moto G15 | Counterpoint 1S26, 4º | 6,72" LCD | 1080×2400 | 60 Hz | ×3 → 800×360 |
| 5 | Samsung Galaxy A16 4G | Counterpoint 1S26, 5º | 6,7" Super AMOLED | 1080×2340 | 90 Hz | ×3 → 780×360 |
| 6 | Samsung Galaxy A15 | 2025 | 6,5" Super AMOLED | 1080×2340 | 90 Hz | ×3 → 780×360 |
| 7 | Xiaomi Redmi Note 13 | 2025 | 6,67" AMOLED | 1080×2400 | 120 Hz | ×3 → 800×360 |
| 8 | Motorola Moto G84 | 2025 | 6,55" pOLED | 1080×2400 | 120 Hz | ×3 → 800×360 |
| 9 | Apple iPhone 13 | 2025 | 6,1" OLED | 1170×2532 | 60 Hz | ×3 → 844×390 |
| 10 | Xiaomi POCO X6 | 2025 | 6,67" AMOLED | 1220×2712 | 120 Hz | ×3 → 904×407 |
| — | Samsung Galaxy S20 FE (aparelho de teste) | — | 6,5" Super AMOLED | 1080×2400 | 120 Hz | ×3 → 800×360 |

Resoluções: ficha técnica dos fabricantes (confira antes de usar em material de loja). O **zoom** é o que o jogo escolhe (`computeView` em `src/logic/viewport.ts`: zoom inteiro pela altura física, `LOGICAL_H = 360`); a área lógica é o que cabe na tela em "pixels do jogo". O iPhone entra por fatia de mercado, mas o build iOS ainda está fora do escopo (PLAN P2.5.5).

## O que isso significa

- **Duas classes de tela:** 720 px (zoom 2) e 1080–1220 px (zoom 3). Em ambas a área lógica fica entre 780×360 e 904×407: todo o layout cabe em **~800×360 lógicos**, então o QA de 800×360 cobre a maioria.
- **Proporção 19,5:9 a 20:9:** mais larga que 16:9; o mundo mostra mais colunas nas laterais, e os painéis de menu ficam com sobra horizontal.
- **Tamanho físico:** o zoom compensa a densidade, então 1 pixel lógico fica com **~0,2 mm** nos dois grupos (720p ×2 e 1080p ×3, telas de 6,5–6,9"). Texto de 8 px lógicos tem **~1,6 mm** de altura: pequeno demais para leitura confortável no celular (o mínimo recomendado para texto corrido fica perto de 2,5 mm). Alvos de toque pedem ≥ 48 dp (~9 mm) → **~45 px lógicos**.
- **Recorte da câmera:** em paisagem, o WebView não desenha na faixa do recorte (validado no emulador com recorte), então o HUD não fica embaixo do furo.
- **Desempenho:** Galaxy A07 e Moto G06 são os mais fracos e os mais vendidos; medir FPS neles (ou num emulador com perfil equivalente) é prioridade.

## Como testar

```bash
bun run dev                                                # outro terminal
bun scripts/qa-devices.ts --set mobile --url http://localhost:5191   # 11 aparelhos, 5 telas cada
bun scripts/qa-devices.ts --set mobile --only galaxy-a07,moto-g06 game shop
bun scripts/qa-android.ts --serial <emulador ou celular>   # APK real: ponte Capacitor, voltar, save
```

Saída em `qa-devices/mobile/<aparelho>/*.png` + `index.md` (gitignored). Resultado em 2026-09-29: 11/11 sem erros no console.

## Fontes

- [Mobile Time — Mercado de smartphones no Brasil registra queda de 11% no 1S26 (Counterpoint)](https://www.mobiletime.com.br/noticias/18/09/2026/smartphones-brasil-1s26/)
- [ACIARA — Venda de celulares Brasil 2026 (IDC 1T26)](https://aciara.com.br/venda-celulares-brasil-2026-apple/)
- [TechTudo — Celulares mais vendidos em 2026 até agora](https://www.techtudo.com.br/listas/2026/04/celulares-mais-vendidos-em-2026-ate-agora-veja-se-valem-a-pena-edmobile.ghtml)
- [Super Rádio Tupi — Os 5 celulares mais vendidos no Brasil em 2025](https://www.tupi.fm/tecnologia/esses-sao-os-5-celulares-mais-vendidos-no-brasil-em-2025/)
