# Status dos assets

> **Linha pixel art (branch `pixel-art`, congelada):** este relatório é dela, com a arte gerada pelo PixelLab. Na `main` o visual é a Art Bible v3 pintada desde 2026-10-27 ([visual.md](visual.md) §0; antes, o híbrido da v2): a arte de UI é desenhada por código (`src/art/flat.ts`) e os scripts que geravam este relatório saíram. Vale só o áudio.
>
> Gerado por `bun scripts/assets-status.ts` (script removido; as seções `music` e `vo` foram atualizadas à mão em 2026-10-28 com o lote final de áudio) a partir de `scripts/assets-keys.ts` e `scripts/el-catalog.ts`. Não edite à mão.
> ✅ arte/áudio final · ⬜ placeholder de código (visual) ou silêncio (áudio).

**Tier 1 (ALPHA): 239/239** · **Tier 2 (BETA): 530/530** · total 769/769

| Categoria | Tier 1 | Tier 2 |
|---|---|---|
| portrait | 80/80 | 20/20 |
| boss | 6/6 | 4/4 |
| manha | 20/20 | 40/40 |
| simpatia | 4/4 | 4/4 |
| lance | 7/7 | 0/0 |
| pack | 4/4 | 0/0 |
| upgrade | 0/0 | 6/6 |
| promise | 0/0 | 8/8 |
| bg | 2/2 | 7/7 |
| ui | 21/21 | 0/0 |
| trophy | 0/0 | 4/4 |
| card.face | 60/60 | 0/0 |
| card.back | 1/1 | 4/4 |
| card.mod | 3/3 | 4/4 |
| table | 1/1 | 0/0 |
| sfx | 24/24 | 0/0 |
| music | 5/5 | 4/4 |
| amb | 1/1 | 7/7 |
| vo | 0/0 | 418/418 |

## Aguardando aprovação do usuário

- **A1.2 carta âncora (3♣, zap 4♣) + verso `card.back.default`:** as 40 faces atuais são desenhadas por código (custo zero) com J/Q/K do PixelLab e ficam no jogo como provisórias. Nenhum lote pago de faces sai antes da aprovação.

## portrait

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `portrait.bruto.neutral` | 1 | PixelLab | ✅ |
| `portrait.bruto.happy` | 1 | PixelLab | ✅ |
| `portrait.bruto.angry` | 1 | PixelLab | ✅ |
| `portrait.bruto.sweat` | 1 | PixelLab | ✅ |
| `portrait.bruto.wink` | 1 | PixelLab | ✅ |
| `portrait.bruto.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.bruto.mouth` | 1 | PixelLab | ✅ |
| `portrait.bruto.tongue` | 1 | PixelLab | ✅ |
| `portrait.bruto.lip` | 1 | PixelLab | ✅ |
| `portrait.bruto.up` | 1 | PixelLab | ✅ |
| `portrait.cida.neutral` | 1 | PixelLab | ✅ |
| `portrait.cida.happy` | 1 | PixelLab | ✅ |
| `portrait.cida.angry` | 1 | PixelLab | ✅ |
| `portrait.cida.sweat` | 1 | PixelLab | ✅ |
| `portrait.cida.wink` | 1 | PixelLab | ✅ |
| `portrait.cida.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.cida.mouth` | 1 | PixelLab | ✅ |
| `portrait.cida.tongue` | 1 | PixelLab | ✅ |
| `portrait.cida.lip` | 1 | PixelLab | ✅ |
| `portrait.cida.up` | 1 | PixelLab | ✅ |
| `portrait.ze.neutral` | 1 | PixelLab | ✅ |
| `portrait.ze.happy` | 1 | PixelLab | ✅ |
| `portrait.ze.angry` | 1 | PixelLab | ✅ |
| `portrait.ze.sweat` | 1 | PixelLab | ✅ |
| `portrait.ze.wink` | 1 | PixelLab | ✅ |
| `portrait.ze.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.ze.mouth` | 1 | PixelLab | ✅ |
| `portrait.ze.tongue` | 1 | PixelLab | ✅ |
| `portrait.ze.lip` | 1 | PixelLab | ✅ |
| `portrait.ze.up` | 1 | PixelLab | ✅ |
| `portrait.mia.neutral` | 1 | PixelLab | ✅ |
| `portrait.mia.happy` | 1 | PixelLab | ✅ |
| `portrait.mia.angry` | 1 | PixelLab | ✅ |
| `portrait.mia.sweat` | 1 | PixelLab | ✅ |
| `portrait.mia.wink` | 1 | PixelLab | ✅ |
| `portrait.mia.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.mia.mouth` | 1 | PixelLab | ✅ |
| `portrait.mia.tongue` | 1 | PixelLab | ✅ |
| `portrait.mia.lip` | 1 | PixelLab | ✅ |
| `portrait.mia.up` | 1 | PixelLab | ✅ |
| `portrait.chico.neutral` | 1 | PixelLab | ✅ |
| `portrait.chico.happy` | 1 | PixelLab | ✅ |
| `portrait.chico.angry` | 1 | PixelLab | ✅ |
| `portrait.chico.sweat` | 1 | PixelLab | ✅ |
| `portrait.chico.wink` | 1 | PixelLab | ✅ |
| `portrait.chico.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.chico.mouth` | 1 | PixelLab | ✅ |
| `portrait.chico.tongue` | 1 | PixelLab | ✅ |
| `portrait.chico.lip` | 1 | PixelLab | ✅ |
| `portrait.chico.up` | 1 | PixelLab | ✅ |
| `portrait.beti.neutral` | 1 | PixelLab | ✅ |
| `portrait.beti.happy` | 1 | PixelLab | ✅ |
| `portrait.beti.angry` | 1 | PixelLab | ✅ |
| `portrait.beti.sweat` | 1 | PixelLab | ✅ |
| `portrait.beti.wink` | 1 | PixelLab | ✅ |
| `portrait.beti.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.beti.mouth` | 1 | PixelLab | ✅ |
| `portrait.beti.tongue` | 1 | PixelLab | ✅ |
| `portrait.beti.lip` | 1 | PixelLab | ✅ |
| `portrait.beti.up` | 1 | PixelLab | ✅ |
| `portrait.ayla.neutral` | 1 | PixelLab | ✅ |
| `portrait.ayla.happy` | 1 | PixelLab | ✅ |
| `portrait.ayla.angry` | 1 | PixelLab | ✅ |
| `portrait.ayla.sweat` | 1 | PixelLab | ✅ |
| `portrait.ayla.wink` | 1 | PixelLab | ✅ |
| `portrait.ayla.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.ayla.mouth` | 1 | PixelLab | ✅ |
| `portrait.ayla.tongue` | 1 | PixelLab | ✅ |
| `portrait.ayla.lip` | 1 | PixelLab | ✅ |
| `portrait.ayla.up` | 1 | PixelLab | ✅ |
| `portrait.sheila.neutral` | 1 | PixelLab | ✅ |
| `portrait.sheila.happy` | 1 | PixelLab | ✅ |
| `portrait.sheila.angry` | 1 | PixelLab | ✅ |
| `portrait.sheila.sweat` | 1 | PixelLab | ✅ |
| `portrait.sheila.wink` | 1 | PixelLab | ✅ |
| `portrait.sheila.eyebrow` | 1 | PixelLab | ✅ |
| `portrait.sheila.mouth` | 1 | PixelLab | ✅ |
| `portrait.sheila.tongue` | 1 | PixelLab | ✅ |
| `portrait.sheila.lip` | 1 | PixelLab | ✅ |
| `portrait.sheila.up` | 1 | PixelLab | ✅ |
| `portrait.jhony.neutral` | 2 | PixelLab | ✅ |
| `portrait.jhony.happy` | 2 | PixelLab | ✅ |
| `portrait.jhony.angry` | 2 | PixelLab | ✅ |
| `portrait.jhony.sweat` | 2 | PixelLab | ✅ |
| `portrait.jhony.wink` | 2 | PixelLab | ✅ |
| `portrait.jhony.eyebrow` | 2 | PixelLab | ✅ |
| `portrait.jhony.mouth` | 2 | PixelLab | ✅ |
| `portrait.jhony.tongue` | 2 | PixelLab | ✅ |
| `portrait.jhony.lip` | 2 | PixelLab | ✅ |
| `portrait.jhony.up` | 2 | PixelLab | ✅ |
| `portrait.nino.neutral` | 2 | PixelLab | ✅ |
| `portrait.nino.happy` | 2 | PixelLab | ✅ |
| `portrait.nino.angry` | 2 | PixelLab | ✅ |
| `portrait.nino.sweat` | 2 | PixelLab | ✅ |
| `portrait.nino.wink` | 2 | PixelLab | ✅ |
| `portrait.nino.eyebrow` | 2 | PixelLab | ✅ |
| `portrait.nino.mouth` | 2 | PixelLab | ✅ |
| `portrait.nino.tongue` | 2 | PixelLab | ✅ |
| `portrait.nino.lip` | 2 | PixelLab | ✅ |
| `portrait.nino.up` | 2 | PixelLab | ✅ |

## boss

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `boss.valentao` | 1 | PixelLab | ✅ |
| `boss.cartomante` | 1 | PixelLab | ✅ |
| `boss.juiz` | 1 | PixelLab | ✅ |
| `boss.agiota` | 1 | PixelLab | ✅ |
| `boss.tony` | 1 | PixelLab | ✅ |
| `boss.reiDoTruco` | 1 | PixelLab | ✅ |
| `boss.stuart` | 2 | PixelLab | ✅ |
| `boss.peter` | 2 | PixelLab | ✅ |
| `boss.sortuda` | 2 | PixelLab | ✅ |

## manha

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `manha.malandro` | 1 | PixelLab | ✅ |
| `manha.maoDeLixo` | 1 | PixelLab | ✅ |
| `manha.seuZe` | 1 | PixelLab | ✅ |
| `manha.maoLeve` | 1 | PixelLab | ✅ |
| `manha.gritador` | 1 | PixelLab | ✅ |
| `manha.contadorDeCartas` | 1 | PixelLab | ✅ |
| `manha.ultimaCartada` | 1 | PixelLab | ✅ |
| `manha.caraDePau` | 1 | PixelLab | ✅ |
| `manha.sangueFrio` | 1 | PixelLab | ✅ |
| `manha.duplaDinamica` | 1 | PixelLab | ✅ |
| `manha.bisbilhoteiro` | 1 | PixelLab | ✅ |
| `manha.viraViciada` | 1 | PixelLab | ✅ |
| `manha.teatro` | 1 | PixelLab | ✅ |
| `manha.zapZap` | 1 | PixelLab | ✅ |
| `manha.ferroQuente` | 1 | PixelLab | ✅ |
| `manha.reiDaMesa` | 1 | PixelLab | ✅ |
| `manha.cangaceiro` | 1 | PixelLab | ✅ |
| `manha.peQuente` | 1 | PixelLab | ✅ |
| `manha.reviravolta` | 1 | PixelLab | ✅ |
| `manha.onzeLetras` | 1 | PixelLab | ✅ |
| `manha.rendaExtra` | 2 | PixelLab | ✅ |
| `manha.naoDouNada` | 2 | PixelLab | ✅ |
| `manha.figurao` | 2 | PixelLab | ✅ |
| `manha.coracaoMole` | 2 | PixelLab | ✅ |
| `manha.espadachim` | 2 | PixelLab | ✅ |
| `manha.pauFerro` | 2 | PixelLab | ✅ |
| `manha.asNaManga` | 2 | PixelLab | ✅ |
| `manha.doisDeOuro` | 2 | PixelLab | ✅ |
| `manha.tresSecos` | 2 | PixelLab | ✅ |
| `manha.saidaBoa` | 2 | PixelLab | ✅ |
| `manha.vazaDoMeio` | 2 | PixelLab | ✅ |
| `manha.humildade` | 2 | PixelLab | ✅ |
| `manha.apanhouLevantou` | 2 | PixelLab | ✅ |
| `manha.copoAmericano` | 2 | PixelLab | ✅ |
| `manha.olharSerio` | 2 | PixelLab | ✅ |
| `manha.desafio` | 2 | PixelLab | ✅ |
| `manha.seisMaldito` | 2 | PixelLab | ✅ |
| `manha.caoDeGuarda` | 2 | PixelLab | ✅ |
| `manha.contragolpe` | 2 | PixelLab | ✅ |
| `manha.vaiASeis` | 2 | PixelLab | ✅ |
| `manha.parceiroDeAco` | 2 | PixelLab | ✅ |
| `manha.confiaEmMim` | 2 | PixelLab | ✅ |
| `manha.manilhaDeReserva` | 2 | PixelLab | ✅ |
| `manha.mentirosoConvincente` | 2 | PixelLab | ✅ |
| `manha.palavraDeHonra` | 2 | PixelLab | ✅ |
| `manha.peitudo` | 2 | PixelLab | ✅ |
| `manha.caixaDeFosforo` | 2 | PixelLab | ✅ |
| `manha.ouTudoOuNada` | 2 | PixelLab | ✅ |
| `manha.viraDourada` | 2 | PixelLab | ✅ |
| `manha.blefeProfissional` | 2 | PixelLab | ✅ |
| `manha.caraDeTacho` | 2 | PixelLab | ✅ |
| `manha.duplaQuasePerfeita` | 2 | PixelLab | ✅ |
| `manha.quedaLivre` | 2 | PixelLab | ✅ |
| `manha.trucoDeBoteco` | 2 | PixelLab | ✅ |
| `manha.cartaNaManga` | 2 | PixelLab | ✅ |
| `manha.faxina` | 2 | PixelLab | ✅ |
| `manha.zapDeOuro` | 2 | PixelLab | ✅ |
| `manha.maoDeOuro` | 2 | PixelLab | ✅ |
| `manha.dozeOuNada` | 2 | PixelLab | ✅ |
| `manha.lendaDoBoteco` | 2 | PixelLab | ✅ |

## simpatia

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `simpatia.rezaDeVo` | 1 | PixelLab | ✅ |
| `simpatia.benzedeira` | 1 | PixelLab | ✅ |
| `simpatia.espelho` | 1 | PixelLab | ✅ |
| `simpatia.figa` | 1 | PixelLab | ✅ |
| `simpatia.aguaBenta` | 2 | PixelLab | ✅ |
| `simpatia.velaAcesa` | 2 | PixelLab | ✅ |
| `simpatia.olhoGrego` | 2 | PixelLab | ✅ |
| `simpatia.ferradura` | 2 | PixelLab | ✅ |

## lance

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `lance.limpa` | 1 | PixelLab | ✅ |
| `lance.virada` | 1 | PixelLab | ✅ |
| `lance.suada` | 1 | PixelLab | ✅ |
| `lance.corrida` | 1 | PixelLab | ✅ |
| `lance.onze` | 1 | PixelLab | ✅ |
| `lance.ferro` | 1 | PixelLab | ✅ |
| `lance.queda` | 1 | PixelLab | ✅ |

## pack

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `pack.manha` | 1 | PixelLab | ✅ |
| `pack.simpatia` | 1 | PixelLab | ✅ |
| `pack.lance` | 1 | PixelLab | ✅ |
| `pack.baralho` | 1 | PixelLab | ✅ |

## upgrade

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `upgrade.maisManha` | 2 | PixelLab | ✅ |
| `upgrade.maisConsumivel` | 2 | PixelLab | ✅ |
| `upgrade.desconto` | 2 | PixelLab | ✅ |
| `upgrade.rerollBarato` | 2 | PixelLab | ✅ |
| `upgrade.espiarMonte` | 2 | PixelLab | ✅ |
| `upgrade.maisSinal` | 2 | PixelLab | ✅ |

## promise

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `promise.manhaRara` | 2 | PixelLab | ✅ |
| `promise.dezReais` | 2 | PixelLab | ✅ |
| `promise.pacoteGratis` | 2 | PixelLab | ✅ |
| `promise.fichaExtra` | 2 | PixelLab | ✅ |
| `promise.multExtra` | 2 | PixelLab | ✅ |
| `promise.cartaNova` | 2 | PixelLab | ✅ |
| `promise.simpatiaGratis` | 2 | PixelLab | ✅ |
| `promise.vidaExtra` | 2 | PixelLab | ✅ |

## bg

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `bg.botecoBairro` | 1 | PixelLab | ✅ |
| `bg.menu` | 1 | PixelLab | ✅ |
| `bg.barDeEstrada` | 2 | PixelLab | ✅ |
| `bg.quermesse` | 2 | PixelLab | ✅ |
| `bg.clube` | 2 | PixelLab | ✅ |
| `bg.festaDoPeao` | 2 | PixelLab | ✅ |
| `bg.regional` | 2 | PixelLab | ✅ |
| `bg.estadual` | 2 | PixelLab | ✅ |
| `bg.reiDoTruco` | 2 | PixelLab | ✅ |

## ui

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `ui.chip` | 1 | PixelLab | ✅ |
| `ui.mult` | 1 | PixelLab | ✅ |
| `ui.coin` | 1 | PixelLab | ✅ |
| `ui.tento` | 1 | PixelLab | ✅ |
| `ui.signal.wink` | 1 | PixelLab | ✅ |
| `ui.signal.eyebrow` | 1 | PixelLab | ✅ |
| `ui.signal.mouth` | 1 | PixelLab | ✅ |
| `ui.signal.tongue` | 1 | PixelLab | ✅ |
| `ui.signal.lip` | 1 | PixelLab | ✅ |
| `ui.signal.up` | 1 | PixelLab | ✅ |
| `ui.suit.clubs` | 1 | code | ✅ |
| `ui.suit.hearts` | 1 | code | ✅ |
| `ui.suit.spades` | 1 | code | ✅ |
| `ui.suit.diamonds` | 1 | code | ✅ |
| `ui.panel` | 1 | code | ✅ |
| `ui.panel.dark` | 1 | code | ✅ |
| `ui.button` | 1 | code | ✅ |
| `ui.button.hover` | 1 | code | ✅ |
| `ui.button.truco` | 1 | code | ✅ |
| `ui.fame` | 1 | code | ✅ |
| `ui.slot.manha` | 1 | code | ✅ |

## trophy

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `trophy.bronze` | 2 | PixelLab | ✅ |
| `trophy.silver` | 2 | PixelLab | ✅ |
| `trophy.gold` | 2 | PixelLab | ✅ |
| `trophy.platinum` | 2 | PixelLab | ✅ |

## card.face

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `card.4.clubs` | 1 | code | ✅ |
| `card.4.clubs.4c` | 1 | code | ✅ |
| `card.4.hearts` | 1 | code | ✅ |
| `card.4.spades` | 1 | code | ✅ |
| `card.4.diamonds` | 1 | code | ✅ |
| `card.4.diamonds.4c` | 1 | code | ✅ |
| `card.5.clubs` | 1 | code | ✅ |
| `card.5.clubs.4c` | 1 | code | ✅ |
| `card.5.hearts` | 1 | code | ✅ |
| `card.5.spades` | 1 | code | ✅ |
| `card.5.diamonds` | 1 | code | ✅ |
| `card.5.diamonds.4c` | 1 | code | ✅ |
| `card.6.clubs` | 1 | code | ✅ |
| `card.6.clubs.4c` | 1 | code | ✅ |
| `card.6.hearts` | 1 | code | ✅ |
| `card.6.spades` | 1 | code | ✅ |
| `card.6.diamonds` | 1 | code | ✅ |
| `card.6.diamonds.4c` | 1 | code | ✅ |
| `card.7.clubs` | 1 | code | ✅ |
| `card.7.clubs.4c` | 1 | code | ✅ |
| `card.7.hearts` | 1 | code | ✅ |
| `card.7.spades` | 1 | code | ✅ |
| `card.7.diamonds` | 1 | code | ✅ |
| `card.7.diamonds.4c` | 1 | code | ✅ |
| `card.Q.clubs` | 1 | code + PixelLab | ✅ |
| `card.Q.clubs.4c` | 1 | code | ✅ |
| `card.Q.hearts` | 1 | code + PixelLab | ✅ |
| `card.Q.spades` | 1 | code + PixelLab | ✅ |
| `card.Q.diamonds` | 1 | code + PixelLab | ✅ |
| `card.Q.diamonds.4c` | 1 | code | ✅ |
| `card.J.clubs` | 1 | code + PixelLab | ✅ |
| `card.J.clubs.4c` | 1 | code | ✅ |
| `card.J.hearts` | 1 | code + PixelLab | ✅ |
| `card.J.spades` | 1 | code + PixelLab | ✅ |
| `card.J.diamonds` | 1 | code + PixelLab | ✅ |
| `card.J.diamonds.4c` | 1 | code | ✅ |
| `card.K.clubs` | 1 | code + PixelLab | ✅ |
| `card.K.clubs.4c` | 1 | code | ✅ |
| `card.K.hearts` | 1 | code + PixelLab | ✅ |
| `card.K.spades` | 1 | code + PixelLab | ✅ |
| `card.K.diamonds` | 1 | code + PixelLab | ✅ |
| `card.K.diamonds.4c` | 1 | code | ✅ |
| `card.A.clubs` | 1 | code | ✅ |
| `card.A.clubs.4c` | 1 | code | ✅ |
| `card.A.hearts` | 1 | code | ✅ |
| `card.A.spades` | 1 | code | ✅ |
| `card.A.diamonds` | 1 | code | ✅ |
| `card.A.diamonds.4c` | 1 | code | ✅ |
| `card.2.clubs` | 1 | code | ✅ |
| `card.2.clubs.4c` | 1 | code | ✅ |
| `card.2.hearts` | 1 | code | ✅ |
| `card.2.spades` | 1 | code | ✅ |
| `card.2.diamonds` | 1 | code | ✅ |
| `card.2.diamonds.4c` | 1 | code | ✅ |
| `card.3.clubs` | 1 | code | ✅ |
| `card.3.clubs.4c` | 1 | code | ✅ |
| `card.3.hearts` | 1 | code | ✅ |
| `card.3.spades` | 1 | code | ✅ |
| `card.3.diamonds` | 1 | code | ✅ |
| `card.3.diamonds.4c` | 1 | code | ✅ |

## card.back

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `card.back.default` | 1 | code | ✅ |
| `card.back.interior` | 2 | code | ✅ |
| `card.back.blefe` | 2 | code | ✅ |
| `card.back.dinheiro` | 2 | code | ✅ |
| `card.back.viciado` | 2 | code | ✅ |

## card.mod

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `card.mod.gold` | 1 | code | ✅ |
| `card.mod.heavy` | 1 | code | ✅ |
| `card.mod.hot` | 1 | code | ✅ |
| `card.mod.nervosa` | 2 | code | ✅ |
| `card.mod.mentirosa` | 2 | code | ✅ |
| `card.mod.marcada` | 2 | code | ✅ |
| `card.mod.vidro` | 2 | code | ✅ |

## table

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `table.formica` | 1 | code | ✅ |

## sfx

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `sfx.card.shuffle` | 1 | ElevenLabs | ✅ |
| `sfx.card.deal` | 1 | ElevenLabs | ✅ |
| `sfx.card.play` | 1 | ElevenLabs | ✅ |
| `sfx.card.flip` | 1 | ElevenLabs | ✅ |
| `sfx.trick.win` | 1 | ElevenLabs | ✅ |
| `sfx.truco` | 1 | ElevenLabs | ✅ |
| `sfx.bet.accept` | 1 | ElevenLabs | ✅ |
| `sfx.bet.run` | 1 | ElevenLabs | ✅ |
| `sfx.signal` | 1 | ElevenLabs | ✅ |
| `sfx.signal.caught` | 1 | ElevenLabs | ✅ |
| `sfx.score.chip` | 1 | ElevenLabs | ✅ |
| `sfx.score.mult` | 1 | ElevenLabs | ✅ |
| `sfx.score.xmult` | 1 | ElevenLabs | ✅ |
| `sfx.money` | 1 | ElevenLabs | ✅ |
| `sfx.manha.trigger` | 1 | ElevenLabs | ✅ |
| `sfx.table.win` | 1 | ElevenLabs | ✅ |
| `sfx.table.lose` | 1 | ElevenLabs | ✅ |
| `sfx.shop.buy` | 1 | ElevenLabs | ✅ |
| `sfx.shop.reroll` | 1 | ElevenLabs | ✅ |
| `sfx.pack.open` | 1 | ElevenLabs | ✅ |
| `sfx.ui.move` | 1 | ElevenLabs | ✅ |
| `sfx.ui.confirm` | 1 | ElevenLabs | ✅ |
| `sfx.ui.back` | 1 | ElevenLabs | ✅ |
| `sfx.ui.error` | 1 | ElevenLabs | ✅ |

## music

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `music.menu` | 1 | ElevenLabs | ✅ |
| `music.table` | 1 | ElevenLabs | ✅ |
| `music.boss` | 1 | ElevenLabs | ✅ |
| `music.king` | 2 | ElevenLabs | ✅ |
| `music.table2` | 2 | ElevenLabs | ✅ |
| `music.table3` | 2 | ElevenLabs | ✅ |
| `music.table4` | 2 | ElevenLabs | ✅ |
| `music.win` | 1 | ElevenLabs | ✅ |
| `music.lose` | 1 | ElevenLabs | ✅ |

## amb

| Chave | Tier | Fonte | Status |
|---|---|---|---|
| `amb.botecoBairro` | 1 | ElevenLabs | ✅ |
| `amb.barDeEstrada` | 2 | ElevenLabs | ✅ |
| `amb.quermesse` | 2 | ElevenLabs | ✅ |
| `amb.clube` | 2 | ElevenLabs | ✅ |
| `amb.festaDoPeao` | 2 | ElevenLabs | ✅ |
| `amb.regional` | 2 | ElevenLabs | ✅ |
| `amb.estadual` | 2 | ElevenLabs | ✅ |
| `amb.reiDoTruco` | 2 | ElevenLabs | ✅ |

## vo

Lote final 1.0 (2026-10-28): chave `vo.<lang>.<char>.<linha>` (`<lang>` = `pt` | `en`), 2 takes cada, ElevenLabs, todos ✅ e aprovados por `bun scripts/audio-check.ts`. Detalhes em [audio.md](audio.md).

| Personagens | Linhas | Takes |
|---|---|---|
| companheiros `bruto`, `cida`, `jhony`, `nino`, `ze`, `mia`, `chico`, `beti`, `ayla`, `sheila`; chefes `valentao`, `cartomante`, `juiz`, `agiota`, `tony`, `stuart`, `peter`, `sortuda`, `reiDoTruco` | `truco`, `seis`, `nove`, `doze`, `bora`, `ver`, `corre`, `sacanagem`, `piada1`, `piada2`, `piada3` | 19 × 11 × 2 idiomas = 418 chaves, 836 arquivos ✅ |
