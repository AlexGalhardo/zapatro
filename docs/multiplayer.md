# Multiplayer na rede local (LAN)

Até 4 pessoas jogam **Truco até 12** (a Partida Rápida, com coringas e cartas especiais) na mesma rede, em duplas 2×2 ou no mano a mano 1×1, em qualquer mistura de pessoas e bots. É só LAN: sem servidor na internet, sem conta e sem save. A run roguelite continua solo. O servidor usa [Colyseus](https://colyseus.io/) (`@colyseus/core` + `@colyseus/ws-transport` 0.18) e o cliente o `@colyseus/sdk` (o antigo `colyseus.js`, que só fala com servidores até 0.16).

## Decisões (entrevista de 2026-10-27)

| Tema | Decisão |
|---|---|
| Modo | Truco puro até 12, sem loja, Manhas nem save |
| Servidor | Uma sala `truco` por servidor. `bun run lan-server` num PC da rede, ou o app desktop (Electron) que embute o mesmo servidor ("Criar mesa") |
| Encontrar a mesa | Digitar `IP` ou `IP:porta` (porta padrão 2567); o anfitrião vê os endereços dele no lobby. Sem descoberta automática |
| Lobby | 4 assentos em volta da mesa (2 no modo 1×1, veja abaixo); quem senta de frente é parceiro (assentos 0 e 2 contra 1 e 3). Cada pessoa escolhe assento livre, apelido e retrato do elenco (sem repetir) |
| Baralho | O mesmo da Partida Rápida: 40 comuns, 2 coringas e Trevo, Olho e Raio (`fullDeck()`); a visão mascarada esconde o que o Olho revela de quem não pode ver |
| Vazios | Viram bots (perfis de IA e retratos do elenco); dá para começar com 1 pessoa. Só o anfitrião (o primeiro a entrar) começa |
| Autoridade | O servidor roda a lógica pura (`Match`) e valida cada `Action`. Cada cliente recebe só a sua visão |
| Relógio de jogada | 30 s por padrão; o anfitrião escolhe no lobby: desligado, 15, 30 ou 60 s. Vale para toda decisão que o servidor espera de um humano (carta, resposta ao truco, mão de 11). No fim do relógio o servidor joga a ação que o bot (perfil `pro`) escolheria. Dois estouros seguidos do mesmo assento ligam o piloto automático: o servidor joga os turnos dele como bot (com a pausa normal) até o jogador agir ou tocar em "Voltei". Agir no tempo zera a contagem |
| Queda | Mesa espera 30 s pela volta do jogador (o SDK reconecta sozinho); depois um bot (perfil `pro`) assume o assento |
| Plataformas | Desktop (Electron) cria ou entra; Android entra; navegador só em `http://` (dev). O site `https://` não oferece o menu: o navegador bloqueia `ws://` de outro computador numa página `https` |

## Decisões para a 1.0 (entrevista de 2026-11-11; implementadas: relógio, modo 1×1, cartas especiais e saída do anfitrião; faltam as demais de R4)

Plano e aceite em [ROADMAP.md](../ROADMAP.md), grupo R4.

| Tema | Decisão |
|---|---|
| Modos | Mesa 2×2 ou 1×1 (mano a mano), escolhida pelo anfitrião; qualquer formação de humanos e NPCs (D-77, D-79) |
| Baralho | Coringas e cartas especiais (Trevo, Olho, Raio) entram; a visão mascarada esconde o que o Olho revela (D-79) |
| Relógio | 30 s por jogada; no estouro o servidor faz a jogada do bot; dois estouros seguidos ligam o piloto automático; o anfitrião escolhe desligado, 15, 30 ou 60 s (D-81) |
| Android | Também cria mesa: o servidor roda dentro do app (D-80; dependência nativa em avaliação) |
| Fora | Pontuação roguelite na mesa da rede e run cooperativa (D-79) |

## Como funciona

```text
src/net/protocol.ts   mensagens e constantes (porta, sala, 30 s); só tipos, sem Colyseus
src/net/view.ts       visão de um jogador: assentos girados (você = assento 0), duplas trocadas
                      se o assento real é ímpar, cartas que ele não pode ler = HIDDEN
src/net/client.ts     NetClient: conexão, caixa de entrada enquanto nenhuma cena escuta
src/game/remote-match.ts  Match que não joga: recebe o snapshot do servidor (load)
lan/room.ts           TrucoRoom: lobby, Match real, bots, queda e volta
lan/server.ts         startLanServer(porta) e lanAddresses(); lan/cli.ts é o `bun run lan-server`
src/scenes/LanScene.ts  formulário (DOM) e lobby; src/scenes/TableScene.ts em modo rede
```

- **Mensagens:** uma só chave Colyseus (`m`) com um objeto tipado (`ClientMessage` e `ServerMessage`), em JSON para que `undefined` não vire `null`. Sem Schema: um estado sincronizado vazaria as mãos. O servidor confere o formato de cada mensagem (`isMessage` em `lan/room.ts`) e descarta o que não for `ClientMessage`; um erro ao tratar uma mensagem devolve `rejected` e nunca derruba a sala.
- **Visão girada:** a cena sempre desenha "você" embaixo, então o servidor manda `viewState` e `viewEvent` girados. `legalActions` sobre a visão dá as mesmas ações do servidor com o assento girado, e `realAction` desfaz a rotação. Cartas viradas dos outros, sinais não flagrados e as mãos dos outros nunca saem do servidor (a mão do parceiro só na mão de 11 da dupla; todas, após o `showdown` do coringa).
- **Mesa:** `TableScene` ganha `net`. `pump` não decide pelas IAs (o servidor joga os bots, com 800 ms de pausa) nem dá a mão seguinte; cada `step` ou `deal` entra numa fila e anima com as mesmas animações da partida local. O botão do fim volta ao lobby. Se o anfitrião já começou a partida seguinte enquanto alguém olhava o painel do fim, esse jogador volta ao lobby e a `LanScene` pede a mesa de novo (`resync`): o servidor reenvia o `start` e ele entra na partida em andamento.
- **Relógio:** `tick` em `lan/room.ts` reaproveita o mesmo temporizador dos bots: num turno humano ele espera `clockS` (opção `clockMs` da sala nos testes) e, ao estourar, aplica `aiAction` pelo mesmo `act` de qualquer ação. Constantes (`TURN_CLOCK_CHOICES_S`, `TURN_CLOCK_DEFAULT_S`, `AUTOPILOT_AFTER`, `TURN_CLOCK_WARN_S`) em `src/net/protocol.ts`. Mensagens: `lobby.clockS`; cliente → servidor `{ type: 'clock', seconds }` (só o anfitrião, no lobby, valores da lista) e `{ type: 'back' }`; servidor → cliente `{ type: 'timer', seat, ms, auto }` após cada passo, com o assento cronometrado já girado para a visão do cliente, os ms restantes (duração, não horário) e os assentos em piloto automático. A mesa desenha uma barra que esvazia sobre o assento cronometrado, um tique nos últimos 5 s do seu turno e, em piloto automático, um painel com o botão "Voltei"; os outros assentos em piloto mostram "AUTO".
- **Modo da mesa (R4.2):** `LobbyState.mode` é `'2v2'` (padrão) ou `'1v1'` (`TABLE_MODES`, `MODE_SEATS` em `src/net/protocol.ts`). Só o anfitrião, no lobby, manda `{ type: 'mode', mode }`. No 1×1 existem os assentos 0 e 1 (a `LanScene` desenha os dois frente a frente) e a sala baixa `maxClients` para 2, então um terceiro não entra (o `join` do SDK falha). **Trocar para 1×1 com gente sentada nos assentos 2 ou 3 é recusado** (a mensagem é ignorada e o lobby não muda; ninguém é movido nem derrubado em silêncio): a pessoa senta antes num assento livre de 0 ou 1 ou sai, e o botão de modo avisa o motivo no feltro. Voltar para 2×2 é sempre aceito. Nenhum modo muda no meio da partida. `TableStart.seats` e `snap.state.seats` trazem o tamanho (2 ou 4); com 2, `chars` e `names` dos assentos 2 e 3 vêm vazios. `RemoteMatch.seats` copia o valor do snapshot a cada `load`, para a cena montar o layout por `match.seats`.
- **Visão com 2 assentos:** `toView`, `fromView`, `viewEvent` e `realAction` recebem o número de assentos (padrão 4) e giram módulo 2 no 1×1; as tuplas de 4 giram só os assentos que existem e os vazios ficam onde estão.
- **Cartas especiais (R4.9):** o servidor joga com `fullDeck()`. `viewState` manda `known` só com o que o Olho mostrou à dupla do jogador, e só enquanto a carta ainda está na mão daquele rival; essa carta sai de `HIDDEN` na mão dele (a cena a acha por `seat` e `id`, como na mesa local). O `showdown` do coringa mostra todas as mãos a todos, como nas regras; `swap` e `redraw` trocam as mãos no servidor e cada snapshot é mascarado de novo (o monte `stock` nunca sai). Um `peek` da outra dupla nunca é enviado.
- **Saída do anfitrião (R4.4):** no lobby, quem sai passa a chefia ao primeiro sentado (por ordem de assento), que recebe início, relógio e modo pelo `lobby.host`. No meio da partida, o assento vira bot (`RECONNECT_S` vale antes) e a partida segue; a chefia vai para o primeiro humano sentado e vale no lobby seguinte. Se ninguém sobra, a partida acaba e o próximo a entrar é o anfitrião.
- **Queda:** `onDrop` segura o assento por `RECONNECT_S`; sem volta, `onLeave` coloca um bot. Se sobra ninguém, a partida acaba e o lobby reabre.

## Testar

```text
bun run lan-server                 # imprime os endereços (IP:2567)
bun run dev                        # cada jogador abre o jogo e escolhe "Multiplayer na rede local"
bun test tests/lan.test.ts tests/net-view.test.ts
```

`scripts/lan-smoke.ts` é o teste de ponta a ponta no navegador (fora do CI por enquanto; só 2×2, porque a `TableScene` ainda não desenha o 1×1): depois de `bun run build`, `bun scripts/lan-smoke.ts [--shots pasta] [--cli]` serve o `dist/` (`--url` usa outro servidor, mas um servidor de dev recarrega as páginas quando alguém edita um arquivo) e sobe o servidor (ou, com `--cli`, o `lan/cli.ts` de verdade, com bots lentos), abre dois clientes Playwright e joga três partidas inteiras pelas cenas do jogo: formulário, lobby, mesa com bots jogando ações aleatórias (truco, aceitar, correr, sinal), manual (F1) aberto sobre a mesa, fim, volta ao lobby; a partida seguinte começada enquanto o outro cliente ainda está no painel do fim (ele volta pelo lobby com `resync`); uma queda de socket com reconexão (código 4010); uma saída no meio (um bot assume); e um lobby novo depois que todos saíram. Falha com erros de console de qualquer cliente ou do servidor.

`tests/lan.test.ts` sobe um servidor real e joga partidas completas com clientes do SDK: as formações 2×2 (dois parceiros contra dois bots, dois adversários cada um com bot de parceiro, três pessoas e um bot, quatro pessoas) e 1×1 (pessoa contra pessoa e contra bot), a troca de modo (aceita, recusada com gente nos assentos 2 e 3, terceiro jogador recusado no 1×1), a saída do anfitrião no lobby e no meio da partida e o relógio. `tests/net-view.test.ts` cobre a rotação (4 e 2 assentos) e, em partidas com semente e o baralho completo, que nenhuma mensagem de nenhuma visão traz uma carta que aquele assento não possa ler.

## Desktop e Android

- **Electron:** `scripts/build-electron.ts` empacota `lan/server.ts` com `bun build --target=node` em `desktop/build/lan-server.mjs` (gitignored, listado em `files` do electron-builder). O IPC `lan:host` (`desktop/main.js`, ponte `trucoShell.hostLan` no preload) inicia o servidor uma vez e devolve a porta e os IPs. `allowRunningInsecureContent` deixa a página `app://` abrir `ws://` para outro computador. Verificado no Electron 44 (Linux, xvfb): o servidor sobe e o anfitrião entra no próprio lobby. **Não verificado:** entrar de outro computador (o contêiner de teste não tem uma segunda máquina) nem o empacotado com o electron-builder.
- **Android:** `capacitor.config.json` com `allowMixedContent` e `usesCleartextTraffic` no manifesto, para o WebView abrir `ws://192.168.x.x`. Não verificado em aparelho.
- **Firewall:** o anfitrião precisa liberar a porta 2567 (o Windows pergunta na primeira vez).

## Fora desta versão

Run co-op, descoberta automática de salas, chat, espectadores, mais de uma mesa por servidor, jogar pela internet.
