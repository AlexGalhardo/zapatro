# Conquistas da Steam (planilha)

São **37 conquistas**, uma para cada feito de `src/data/feats.ts` (`FEATS.length` = 37, a mesma contagem do GDD e do relatório). Cada feito desbloqueado no jogo vira a conquista de mesmo nome na Steam (D-28).

Esta planilha é o cadastro de referência para o Steamworks. Os textos vêm de `src/i18n/en.ts` e `src/i18n/pt-BR.ts` na data de hoje (2026-10-25); se um texto mudar no jogo, atualize aqui antes de publicar.

## Como o feito vira conquista

- O **API name** é exatamente o id do feito (`FEATS[].id`). Não há prefixo nem conversão. Isso vem de `desktop/steam.js` (comentário no topo e `unlockAchievements`, que passa o id direto para `client.achievement.activate`).
- Só entram ids que casam com `^\w{1,64}$`. Todos os 37 ids são camelCase ASCII, então todos passam.
- `src/core/steam.ts` chama a ponte `window.trucoSteam.unlock(ids)` quando um feito é desbloqueado (`src/ui/toast.ts`) e, no boot, com todos os feitos já salvos (`src/main.ts`). Quem já tem o feito não é ativado de novo.
- Fora do Electron (web, Android) a ponte não existe e nada acontece.
- Sem `steamAppId` em `desktop/package.json` (ou `STEAM_APP_ID` no ambiente), o módulo nem liga. Hoje o App ID ainda não existe (pendência humana, ver `docs/launch-game.md` §1.1).

## Planilha

Colunas: API name (o id, sem mudança), nome e descrição em EN e PT-BR, se a conquista é oculta, e a ideia de ícone para o artista. Ícone: 256×256, versão colorida (desbloqueada) e versão cinza (bloqueada). Pela Art Bible, estilo vetor chapado com sombra sólida, sem gradiente, e sem texto embutido na imagem (use símbolos: fichas, cartas, coroa, troféu).

Oculta = "sim" só para feitos que estragam surpresa. Aqui, só vencer o chefe final (Rei do Truco) e o modo infinito.

| API name | Nome EN | Descrição EN | Nome PT-BR | Descrição PT-BR | Oculta? | Ideia de ícone |
|---|---|---|---|---|---|---|
| `primeiraMao` | First hand | Score a hand | Primeira mão | Pontue uma mão | não | uma carta virada sobre o feltro |
| `cemPontos` | Hundred | Score 100 points in one hand | Centena | Faça 100 pontos numa mão | não | placa dourada com cem fichas |
| `milPontos` | Thousand | Score 1,000 points in one hand | Milhar | Faça 1.000 pontos numa mão | não | pilha alta de fichas douradas |
| `dezMil` | Ten thousand | Score 10,000 points in one hand | Dez mil | Faça 10.000 pontos numa mão | não | cofre de madeira cheio de fichas |
| `doze` | Twelve! | Win a hand worth 12 (unlocks legendary Manhas) | Doze! | Vença uma mão de valor 12 (destrava Manhas lendárias) | não | carta com borda dourada e doze pips |
| `ferro` | Iron Hand | Win the iron hand (unlocks the Loaded deck) | Mão de Ferro | Vença a mão de ferro (destrava o Baralho Viciado) | não | punho fechado sobre fundo cinza |
| `lixo` | Trash to treasure | Win with no manilha, 3, 2 or A (unlocks the Countryside deck) | Lixo de luxo | Vença sem manilha, 3, 2 nem A (destrava o Baralho do Interior) | não | monte de lixo com carta de ouro saindo |
| `blefe` | Poker face | Win after a truco with no manilha (unlocks the Bluff deck) | Cara de paisagem | Vença depois de um truco sem manilha (destrava o Baralho do Blefe) | não | rosto sério de costas, carta escondida na mão |
| `queda` | Queda | Score a Queda | Queda | Faça uma Queda | não | placa de placar com tentos caindo |
| `virada` | Comeback | Win a Comeback | Virada | Vença uma Virada | não | seta curva virando sobre si mesma |
| `onze` | Hand of 11 | Win a hand of 11 | Mão de 11 | Vença uma mão de 11 | não | onze fichas e um coração |
| `mesaPerfeita` | Clean table | Win a table with the rivals at 0 tentos | Mesa limpa | Vença uma mesa com os rivais a 0 tentos | não | feltro vazio, sem marcas |
| `chefe` | Boss down | Beat a boss | Chefe no chão | Vença um chefe | não | chapéu caído sobre a mesa |
| `valentao` | Not scared | Beat The Bully | Sem medo | Vença O Valentão | não | chapéu de valentão com um X |
| `professor` | Schooled | Beat The Professor | Lição aprendida | Vença O Professor | não | óculos sobre um livro fechado |
| `sortuda` | Luck runs out | Beat The Lucky One | Acabou a sorte | Vença A Sortuda | não | trevo de quatro folhas partido |
| `campeonato2` | On the road | Reach Championship 2 | Pé na estrada | Chegue ao Campeonato 2 | não | estrada de terra com placa de ida |
| `campeonato4` | Club member | Reach Championship 4 (unlocks Juninho) | Sócio do clube | Chegue ao Campeonato 4 (destrava o Juninho) | não | crachá de clube com estrela |
| `campeonato6` | Regional fame | Reach Championship 6 | Fama regional | Chegue ao Campeonato 6 | não | troféu regional de bronze |
| `reiDoTruco` | Rei do Truco | Win a run | Rei do Truco | Vença uma run | **sim** | coroa sobre um maço de cartas |
| `comTonhao` | Big friend | Win a run with Tonhão | Amigão | Vença uma run com o Tonhão | não | moldura dourada com o retrato do companheiro |
| `comDonaCida` | Granny knows | Win a run with Dona Cida | A vó sabe | Vença uma run com a Dona Cida | não | moldura dourada com o retrato da companheira |
| `comZe` | Smooth operator | Win a run with Zé Malandro | Jogo de cintura | Vença uma run com o Zé Malandro | não | moldura dourada com o retrato do companheiro |
| `comJuninho` | The kid made it | Win a run with Juninho | O moleque chegou | Vença uma run com o Juninho | não | moldura dourada com o retrato do companheiro |
| `doInterior` | Countryside champion | Win a run with the Countryside deck | Campeão do interior | Vença uma run com o Baralho do Interior | não | baralho com estrela e espiga |
| `doDinheiro` | Money talks | Win a run with the Money deck | Dinheiro fala | Vença uma run com o Baralho do Dinheiro | não | maço de notas com moeda |
| `estaca4` | Getting serious | Win a run at Stake 4 | Ficando sério | Vença uma run na Estaca 4 | não | placa de estaca com quatro riscos |
| `estaca8` | Untouchable | Win a run at Stake 8 | Intocável | Vença uma run na Estaca 8 | não | escudo dourado sobre a mesa |
| `infinito` | No end | Reach Championship 10 in endless mode | Sem fim | Chegue ao Campeonato 10 no modo infinito | **sim** | símbolo de infinito sobre o feltro |
| `rico` | Loaded | Hold $30 (unlocks the Money deck) | Endinheirado | Tenha $30 (destrava o Baralho do Dinheiro) | não | ficha dourada e moedas |
| `lendario` | Legend | Own a legendary Manha | Lenda | Tenha uma Manha lendária | não | carta lendária com borda dourada |
| `baralhoMagro` | Thin deck | Play with 25 cards or fewer | Baralho magro | Jogue com 25 cartas ou menos | não | maço fino de cartas |
| `baralhoGordo` | Fat deck | Play with 50 cards or more | Baralho gordo | Jogue com 50 cartas ou mais | não | maço alto de cartas |
| `cemMaos` | Regular | Win 100 hands | Freguesia | Vença 100 mãos | não | balcão de boteco com marcas de contagem |
| `trucador` | Truco caller | Call truco 100 times | Trucador | Peça truco 100 vezes | não | balão de fala com um sinal de "!" |
| `mentiroso` | Liar | Win 5 bluffs (unlocks Zé Malandro) | Mentiroso | Vença 5 blefes (destrava o Zé Malandro) | não | carta com nariz de palhaço escondido |
| `fregues` | Back again | Play 10 runs | De volta | Jogue 10 runs | não | cartão de fidelidade do balcão com dez selos |

Nota: os textos EN e PT-BR acima são os de hoje. Se algum for trocado no jogo, a planilha deve acompanhar.

## Passos no Steamworks

1. Com o App ID criado e o jogo já cadastrado, abra o Steamworks em *App Admin → (seu app) → Stats & Achievements*.
2. Clique em *Add achievement* para cada linha da tabela. Em **API name**, use o id exato (ex.: `primeiraMao`). Trocar o API name depois de publicar pode quebrar o vínculo com o jogo; confira a regra atual na documentação do Steamworks antes de cadastrar.
3. Em **Display name** e **Description**, coloque o texto EN. Adicione o idioma português (Brasil) em *Localization* e cole o texto PT-BR.
4. Marque **Hidden** só nas linhas com "sim" da coluna Oculta.
5. Envie o ícone colorido e o cinza, 256×256, em JPG ou PNG. Os dois são obrigatórios em cada conquista.
6. Salve e confira que as 37 linhas aparecem com o API name certo.
7. Publique as alterações em *Publish → Prepare for Publishing → Publish to Steam*. Conquista não publicada não aparece para o jogador (ver também `docs/launch-game.md` §3.7).
8. Teste no build de `beta` (ou no branch de teste) com a conta de desenvolvedor: desbloqueie um feito (ex.: `primeiraMao`, a primeira mão), confira que a conquista aparece e que reiniciar o jogo não a desbloqueia de novo.

Pendências humanas: App ID, criação das conquistas no Steamworks, ícones finais do artista (37 pares colorido e cinza), publicação.
