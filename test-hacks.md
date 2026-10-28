# Atalhos de teste

Parâmetros de URL para testar rápido (`src/debug/params.ts`, PLAN §10.4). Funcionam no `bun run dev` (<http://localhost:5191>) e no site (<https://truco.lekzera.xyz/play/>, `/demo/`); junte vários com `&`. Os de run (`run`, `partner`, `demo`, `money`, `stake`, `manhas`) valem só para **run nova**: "Continuar run" os ignora. `champ` não entra na run; só muda a ambiência da partida rápida.

## Partida e mesa

| Parâmetro | Valores | Efeito |
| --- | --- | --- |
| `skipMenu=1` | | Abre direto a partida rápida (Truco puro até 12, sem meta de pontos) |
| `goal=N` | inteiro ≥ 1 | Liga a pontuação roguelite na partida rápida, com meta de N pontos (Fichas × Mult, Quedas), como uma mesa da run. Sem ele, a partida rápida é Truco puro até 12 |
| `seed=N` | inteiro ≥ 0 | Embaralhamento, vira e sorteios repetíveis (partida rápida e run nova) |
| `vira=3c` | posto + naipe (`c` paus, `h` copas, `s` espadas, `d` ouros) | Vira da primeira mão |
| `hand=3c,2h,4d` | 3 cartas; `JK`/`JK2` = coringa, `TV`/`OL`/`RA` = cartas especiais | Sua primeira mão |
| `score=11-4` | `nós-eles`, cada um < 12 | Placar inicial: `11-x` mão de onze, `11-11` mão de ferro |
| `reveal=1` | | Mostra as mãos dos rivais |
| `boss=<id>` | `valentao` `cartomante` `juiz` `agiota` `delegado` `professor` `mudo` `sortuda` `reiDoTruco` | Partida rápida contra esse chefe, com a regra dele na lateral. Continua sem meta, a não ser que `goal=N` também esteja na URL |
| `partner=<id>` | `tonhao` `donaCida` `zeMalandro` `juninho` `ze` `bia` `joca` `lurdes` `tiao` `neide` | Parceiro (partida rápida); na run nova força o id entre os 3 candidatos, se destravado |
| `champ=N` | 1–8 | Partida rápida: ambiência sonora do Campeonato N (`2` = Bar de Estrada). Sem efeito na run nova |

## Run

| Parâmetro | Valores | Efeito |
| --- | --- | --- |
| `run=1` | | Começa uma run nova direto na escolha de parceiro |
| `money=N` | inteiro ≥ 0 | Dinheiro inicial da run nova (`RunScene`) |
| `manhas=a,b` | ids de `src/data/manhas.ts` | Manhas iniciais da run nova: ids inválidos são ignorados e a lista é cortada nos slots disponíveis. Na partida rápida, começa com as mesmas Manhas |
| `stake=N` | 1–8 | Estaca preselecionada da run nova, mesmo que ainda esteja bloqueada (limitada à Estaca máxima do jogo) |
| `demo=1` | | Comportamento da demo web (termina no primeiro chefe) sem `VITE_DEMO` |

## Velocidade, bot e depuração

| Parâmetro | Efeito |
| --- | --- |
| `auto=1` | O bot joga no seu lugar (com `run=1`, a run inteira) |
| `speed=1\|2\|4` | Velocidade das animações (outros valores são ignorados) |
| `debug=1` | Lido, mas **sem efeito hoje**: nenhuma sobreposição de depuração consome o parâmetro |
| `qa=1` | Expõe `window.__GAME__` no build de produção (scripts de QA). Em dev, o `__GAME__` já existe |

## Receitas

| Para testar | URL |
| --- | --- |
| Mesa do Boteco, mão fixa | `?skipMenu=1&seed=1&vira=4c&hand=5h,6c,3d` |
| ZAP na mão (vira 4 → 6♣ é o ZAP) | `?skipMenu=1&vira=4c&hand=6c,5s,3d` |
| Coringa e a roleta de efeitos | `?skipMenu=1&hand=JK,3c,2h` |
| Cartas especiais (`TV` Trevo, `OL` Olho, `RA` Raio) | `?skipMenu=1&hand=TV,OL,RA` |
| Mão de onze / mão de ferro | `?skipMenu=1&score=11-4` · `?skipMenu=1&score=11-11` |
| Chefe e a regra dele (partida rápida) | `?skipMenu=1&boss=professor` |
| Ambiência do Bar de Estrada (Campeonato 2) | `?skipMenu=1&champ=2` |
| Pontuação roguelite (Fichas × Mult) | `?skipMenu=1&goal=110` |
| Loja cheia de dinheiro | `?run=1&money=99` |
| Build de Manhas | `?run=1&money=50&manhas=zapZap,zapDeOuro,malandro` |
| Build de Manhas na partida rápida | `?skipMenu=1&goal=110&manhas=zapZap,zapDeOuro,malandro` |
| Fim da demo (vencer o primeiro chefe) | `?run=1&demo=1&auto=1&speed=4` |
| Run inteira assistindo o bot | `?run=1&auto=1&speed=4` |
| Estaca máxima | `?run=1&stake=8` |
| Mesma partida duas vezes | `?skipMenu=1&seed=1234` |
| Ver tudo dos rivais | `?skipMenu=1&reveal=1` |

## Teclado (padrão; troque em Configurações → Controles)

`1` `2` `3` jogar carta · `T` truco/aumentar · `A` aceitar · `C` correr · `S` sinal · `E` encoberta · `L` Lances · `Esc`/`P` pausa · `Tab` velocidade · `M` mudo · `F11` tela cheia. Controle: X confirma, O volta, △ truco, □ sinal, L1 corre, R1 aceita, Options pausa.

## Zerar o progresso

O save (progresso **e** configurações: volume, idioma, teclas) fica no `localStorage`, chave `truco-roguelite.save`, com cópias `.bak` e `.tmp` que o restauram se a principal sumir. É por origem: dev, site, Electron e Android têm saves separados. No console do navegador:

```js
localStorage.clear(); location.reload();
```
