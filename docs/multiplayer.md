# Multiplayer na rede local (LAN)

Até 4 pessoas jogam **Truco puro até 12** (a Partida Rápida) na mesma rede, em duplas 2×2. É só LAN: sem servidor na internet, sem conta e sem save. A run roguelite continua solo. O servidor usa [Colyseus](https://colyseus.io/) (`@colyseus/core` + `@colyseus/ws-transport` 0.18) e o cliente o `@colyseus/sdk` (o antigo `colyseus.js`, que só fala com servidores até 0.16).

## Decisões (entrevista de 2026-10-27)

| Tema | Decisão |
|---|---|
| Modo | Truco puro até 12, sem loja, Manhas nem save |
| Servidor | Uma sala `truco` por servidor. `bun run lan-server` num PC da rede, ou o app desktop (Electron) que embute o mesmo servidor ("Criar mesa") |
| Encontrar a mesa | Digitar `IP` ou `IP:porta` (porta padrão 2567); o anfitrião vê os endereços dele no lobby. Sem descoberta automática |
| Lobby | 4 assentos em volta da mesa; quem senta de frente é parceiro (assentos 0 e 2 contra 1 e 3). Cada pessoa escolhe assento livre, apelido e retrato do elenco (sem repetir) |
| Vazios | Viram bots (perfis de IA e retratos do elenco); dá para começar com 1 pessoa. Só o anfitrião (o primeiro a entrar) começa |
| Autoridade | O servidor roda a lógica pura (`Match`) e valida cada `Action`. Cada cliente recebe só a sua visão |
| Queda | Mesa espera 30 s pela volta do jogador (o SDK reconecta sozinho); depois um bot (perfil `pro`) assume o assento |
| Plataformas | Desktop (Electron) cria ou entra; Android entra; navegador só em `http://` (dev). O site `https://` não oferece o menu: o navegador bloqueia `ws://` de outro computador numa página `https` |

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

- **Mensagens:** uma só chave Colyseus (`m`) com um objeto tipado (`ClientMessage` e `ServerMessage`), em JSON para que `undefined` não vire `null`. Sem Schema: um estado sincronizado vazaria as mãos.
- **Visão girada:** a cena sempre desenha "você" embaixo, então o servidor manda `viewState` e `viewEvent` girados. `legalActions` sobre a visão dá as mesmas ações do servidor com o assento girado, e `realAction` desfaz a rotação. Cartas viradas dos outros, sinais não flagrados e as mãos dos outros nunca saem do servidor (a mão do parceiro só na mão de 11 da dupla; todas, após o `showdown` do coringa).
- **Mesa:** `TableScene` ganha `net`. `pump` não decide pelas IAs (o servidor joga os bots, com 800 ms de pausa) nem dá a mão seguinte; cada `step` ou `deal` entra numa fila e anima com as mesmas animações da partida local. O botão do fim volta ao lobby.
- **Queda:** `onDrop` segura o assento por `RECONNECT_S`; sem volta, `onLeave` coloca um bot. Se sobra ninguém, a partida acaba e o lobby reabre.

## Testar

```text
bun run lan-server                 # imprime os endereços (IP:2567)
bun run dev                        # cada jogador abre o jogo e escolhe "Multiplayer na rede local"
bun test tests/lan.test.ts tests/net-view.test.ts
```

`tests/lan.test.ts` sobe um servidor real e joga partidas completas com clientes do SDK (lobby, 1 pessoa + 3 bots, 4 pessoas, saída no meio). `tests/net-view.test.ts` cobre a rotação e o que fica escondido.

## Desktop e Android

- **Electron:** `scripts/build-electron.ts` empacota `lan/server.ts` com `bun build --target=node` em `desktop/build/lan-server.mjs` (gitignored, listado em `files` do electron-builder). O IPC `lan:host` (`desktop/main.js`, ponte `trucoShell.hostLan` no preload) inicia o servidor uma vez e devolve a porta e os IPs. `allowRunningInsecureContent` deixa a página `app://` abrir `ws://` para outro computador. Verificado no Electron 44 (Linux, xvfb): o servidor sobe e o anfitrião entra no próprio lobby. **Não verificado:** entrar de outro computador (o contêiner de teste não tem uma segunda máquina) nem o empacotado com o electron-builder.
- **Android:** `capacitor.config.json` com `allowMixedContent` e `usesCleartextTraffic` no manifesto, para o WebView abrir `ws://192.168.x.x`. Não verificado em aparelho.
- **Firewall:** o anfitrião precisa liberar a porta 2567 (o Windows pergunta na primeira vez).

## Fora desta versão

Run co-op, descoberta automática de salas, relógio de jogada, chat, espectadores, mais de uma mesa por servidor, jogar pela internet.
