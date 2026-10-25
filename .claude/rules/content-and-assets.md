# Conteúdo, balanceamento e assets

- **Balanceamento:** mudou número de gameplay → `bun scripts/sim.ts` e `bun run balance` têm de continuar passando (metas D-39: bot bom 20–35% na Estaca 1 desde a dobra das metas de 2026-10-25, aleatório < 5%); registre o resultado em `docs/balancing.md`.
- **Referência de estilo:** o presskit do Balatro em `references/` (local, fora do git) e o design em `docs/gdd-game-design-document.md`. Extraia princípios (legibilidade, hierarquia, "juice"); **nunca** copie arte, logo, fonte, layout ou paleta. Identidade: boteco do interior paulista.
- **Conteúdo novo** (Manha, modificador, Simpatia, Lance, Melhoria, Promessa, chefe, companheiro com vantagem e defeito em `src/data/companions.ts`, perfil de IA) é data-driven em `src/data/`, com teste que prova o efeito: siga a skill `add-game-content`.
- **Assets (Art Bible v2):** tudo que a render usa tem chave, desenhada por código em `src/art/flat.ts` (`tex()`), exceto os **retratos 128×128** em `public/assets/gfx/portrait/<id>.png`, gerados por `bun scripts/portraits.ts` a partir de `references/concept-art/zapatro/char-*.png` (nunca peça ao PixelLab um personagem que já tem concept; só o que falta, como O Mudo em `art-src/portrait/`). Chaves em PLAN §7.2.
- **Sons:** ElevenLabs (`scripts/el-*.ts`), normalizados com ffmpeg (`scripts/audio-normalize.ts`); arquivos em `public/assets/audio/sfx|music/<key>.mp3` (takes `<key>.2.mp3`); mapeamento em `src/data/sfx.ts` e `docs/audio.md`.
- **Ícones dos apps:** `bun run app-icons` gera o favicon e os ícones do Electron e do Capacitor a partir de `art-src/app-icon.svg` (depois `bun run --cwd mobile assets`).
- **Chaves** (`PIXELLAB_API_TOKEN`, `ELEVENLABS_API_KEY`) **só no `.env`** (gitignored). Nunca imprimir nem commitar.
