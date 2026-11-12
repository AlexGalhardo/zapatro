# Trailer (`trailer/`)

Projeto **Remotion 4.0.532** (versões fixas, `package.json` e `bun.lock` próprios) que monta o trailer de 60 s e o corte de 15 s para anúncios, em inglês e português, 1920×1080 a 60 fps (PLAN RC3). O roteiro segue o blueprint de [trailer-analysis.md](trailer-analysis.md) §4.

## Fluxo

```text
bun run build && bunx --bun vite preview --port 5192        # jogo em produção (carrega rápido)
bun scripts/record-clips.ts --url http://localhost:5192     # grava os clipes e copia arte/áudio do jogo
cd trailer && bun install && bun run studio                 # ajustar no Remotion Studio
cd trailer && bun run render                                # out/trailer-en.mp4, trailer-pt.mp4, teaser-en.mp4, teaser-pt.mp4
bun run site:build                                          # o push na main publica o site; ele leva trailer/out/trailer-*.mp4 sozinho
```

- `scripts/record-clips.ts` grava `table` (mão inteira com 3 Manhas, truco e contagem), `iron` (mão de ferro), `menu` e `shop` (painéis de mesa e loja) com o Playwright em 1920×1080, seed fixa e o bot. A gravação começa com a página, então `trailer/public/clips/clips.json` guarda o segundo em que cada cena ficou pronta; o trailer corta a partir dali (`<Clip name at>`).
- Arte e áudio vêm do jogo (`public/assets` → `trailer/public/game`, gerado e fora do git). As vozes ficam em português nos dois cortes; textos de tela em `trailer/src/text.ts`.
- Planos de contagem, palavras gritadas (TRUCO!, SEIS!, DOZE!), retratos, campeonatos, chefes e a cartela final são desenhados no Remotion com a paleta e a fonte do site (Pixelify Sans).
