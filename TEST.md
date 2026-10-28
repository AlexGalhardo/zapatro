# Teste: servidor e conteúdo

Servidor de teste (dev, Vite): **<http://localhost:5191/>**

Suba com `bun run dev` (ou `bunx --bun vite --port 5191 --strictPort`) se não estiver no ar. Todos os parâmetros de URL estão em [test-hacks.md](test-hacks.md).

## URLs prontas

| Para testar | URL |
| --- | --- |
| Menu principal (e Almanaque) | `http://localhost:5191/` |
| Run nova com **todos os trinkets** (nível 1) na coleção | `http://localhost:5191/?run=1&money=50&trinkets=acoNaManga,peDeCoelho,zapDeOuro,copoAmericano,baralhoMarcado,coracaoMole,espadachim,maoLeve,tresSecos,figurao,seuZe,duplaDinamica,confiaEmMim,vazaLimpa,virada,gritoDeTruco,seisMaldito,cofrinho,relogioDeBolso,pingaDeAbertura,saideira,viraDourada,lendaDoBoteco,caixaDeFosforo,carteado,maoDeFerro,bicheiro,cantoria,malandragem,diaDeSorte,reiDoPedaco,coringaNoBolso` |
| Run nova com **todos os trinkets** no nível 4 (máximo) | `http://localhost:5191/?run=1&money=50&trinkets=acoNaManga:4,peDeCoelho:4,zapDeOuro:4,copoAmericano:4,baralhoMarcado:4,coracaoMole:4,espadachim:4,maoLeve:4,tresSecos:4,figurao:4,seuZe:4,duplaDinamica:4,confiaEmMim:4,vazaLimpa:4,virada:4,gritoDeTruco:4,seisMaldito:4,cofrinho:4,relogioDeBolso:4,pingaDeAbertura:4,saideira:4,viraDourada:4,lendaDoBoteco:4,caixaDeFosforo:4,carteado:4,maoDeFerro:4,bicheiro:4,cantoria:4,malandragem:4,diaDeSorte:4,reiDoPedaco:4,coringaNoBolso:4` |
| Partida rápida com pontuação, sem run | `http://localhost:5191/?skipMenu=1&goal=110` |
| Partida rápida contra um chefe | `http://localhost:5191/?skipMenu=1&boss=<id>` (ids na seção Chefes) |

Trinkets em `?trinkets=` entram só na run de teste: o perfil não guarda. A run equipa até 4 por vez; o resto fica na coleção, para trocar na loja.

## Almanaque

Abra pelo menu principal, em **Almanaque**. As abas são Manhas, Chefes, Companheiros, Baralhos, Feitos e Estatísticas. Itens bloqueados aparecem com cadeado: o desbloqueio vem do perfil (save no `localStorage`), e a URL não destrava nada. As tabelas abaixo listam o conteúdo completo, para conferir.

### Trinkets (32)

Valores no nível 1. Bônus em verde, contra em vermelho no jogo.

| id | Nome | Bônus | Contra |
| --- | --- | --- | --- |
| `acoNaManga` | Ás na Manga | +20 Fichas por vaza vencida com Ás | K vale −5 Fichas |
| `peDeCoelho` | Pé de Coelho | +3 Mult por vaza vencida com manilha | Meta da mesa +5% |
| `zapDeOuro` | Zap de Ouro | ×1,5 Mult se o zap venceu uma vaza | −1 Mult em mão sem zap na sua mão |
| `copoAmericano` | Copo Americano | +$1 por mão vencida | Itens da loja +$1 |
| `baralhoMarcado` | Baralho Marcado | +15 Fichas por vaza vencida com ♣ | Cartas de ♥ valem −5 Fichas |
| `coracaoMole` | Coração Mole | +2 Mult por vaza vencida com ♥ | Cartas de ♠ valem −5 Fichas |
| `espadachim` | Espadachim | +2 Mult por vaza vencida com ♠ | Cartas de ♦ valem −5 Fichas |
| `maoLeve` | Mão Leve | +$1 por vaza vencida com ♦ | −$1 por mão perdida |
| `tresSecos` | Três Secos | +3 Mult por vaza vencida com um 3 | 2 vale −10 Fichas |
| `figurao` | Figurão | +12 Fichas por vaza vencida com Q, J ou K | 4 a 7 valem −4 Fichas |
| `seuZe` | Seu Zé | +15 Fichas por vaza vencida com 4, 5, 6 ou 7 | Q, J e K valem −4 Fichas |
| `duplaDinamica` | Dupla Dinâmica | +3 Mult por vaza vencida pelo parceiro | −10 Fichas por vaza vencida por você |
| `confiaEmMim` | Confia em Mim | +20 Fichas por vaza vencida pelo parceiro | Mult base −1 (mínimo 1) |
| `vazaLimpa` | Vaza Limpa | ×1,5 Mult se a dupla venceu as duas primeiras vazas | −$1 por mão perdida |
| `virada` | Virada | +6 Mult se perdeu a 1ª vaza e venceu a 2ª | −1 Mult se venceu a 1ª vaza |
| `gritoDeTruco` | Grito de Truco | +4 Mult em mão com truco aceito | −2 Mult em mão onde ninguém pediu truco |
| `seisMaldito` | Seis Maldito | ×2 Mult em mão que vale 6 ou mais | −20% Fichas em mão que vale 1 |
| `cofrinho` | Cofrinho | +$1 a cada $5 guardados (máx. +$3) | Prêmio de Rapidez −$2 |
| `relogioDeBolso` | Relógio de Bolso | Prêmio de Rapidez ×2 | Meta da mesa +10% |
| `pingaDeAbertura` | Pinga de Abertura | +25 Fichas na primeira mão da mesa | −2 Fichas nas outras mãos |
| `saideira` | Saideira | +10 Mult quando falta 20% ou menos da meta | −1 Mult quando falta mais da metade |
| `viraDourada` | Vira Dourada | ×1,5 Mult por vaza vencida com manilha | Manilhas valem −10 Fichas |
| `lendaDoBoteco` | Lenda do Boteco | ×1,5 Mult por vaza vencida | −1 tento ao perder uma mão |
| `caixaDeFosforo` | Caixa de Fósforo | +$1 por vaza vencida com manilha | Itens da loja +$1 |
| `carteado` | Carteado | +2 Fichas por carta comum jogada pela dupla | Cartas especiais valem −10 Fichas |
| `maoDeFerro` | Mão de Ferro | +8 Mult na mão de 11 e na mão de ferro | −1 Mult nas mãos normais |
| `bicheiro` | Bicheiro | 25% de chance de dobrar o dinheiro ganho na mesa | Meta da mesa +8% |
| `cantoria` | Cantoria | +5 Fichas por sinal enviado pela dupla | Rivais flagram sinais +10% |
| `malandragem` | Malandragem | +6 Mult ao vencer um truco com mão fraca | −$2 quando a dupla corre de um truco |
| `diaDeSorte` | Dia de Sorte | Começa cada mesa com +1 tento | Começa cada mesa com −$1 |
| `reiDoPedaco` | Rei do Pedaço | +1 Mult base por mesa vencida na run (máx. +5) | Meta da mesa +5% por Campeonato |
| `coringaNoBolso` | Coringa no Bolso | Coringas abertos: +20 Fichas e +2 Mult | Coringas valem −10 Fichas |

### Manhas (58)

| id | Nome | Efeito |
| --- | --- | --- |
| `malandro` | Malandro | +4 Mult se você pediu truco sem ter manilha |
| `maoDeLixo` | Mão de Lixo | Perder a 1ª vaza dá +$2 |
| `seuZe` | Seu Zé | +15 Fichas por vaza vencida com 4, 5, 6 ou 7 |
| `maoLeve` | Mão Leve | +$1 por vaza vencida com carta de ♦ |
| `ultimaCartada` | Última Cartada | ×2 Mult se você perdeu a 1ª vaza e venceu a 3ª |
| `sangueFrio` | Sangue Frio | +8 Mult quando a aposta é 6 ou mais |
| `duplaDinamica` | Dupla Dinâmica | +3 Mult por vaza vencida pelo parceiro |
| `teatro` | Teatro | ×3 Mult quando o rival corre e você não tinha manilha |
| `zapZap` | Zap Zap | ×1,5 Mult por vaza vencida com o zap na mão |
| `ferroQuente` | Ferro Quente | ×4 Mult ao vencer a mão de ferro |
| `cangaceiro` | Cangaceiro | +8 Mult se alguma vaza cangou |
| `peQuente` | Pé-Quente | +30 Fichas na Vaza Limpa |
| `reviravolta` | Reviravolta | +6 Mult na Virada |
| `onzeLetras` | Onze Letras | ×2 Mult ao vencer a mão de 11 |
| `gritador` | Gritador | O 1º truco aceito da mesa sobe um degrau a mais (3 → 6) |
| `contadorDeCartas` | Contador de Cartas | Mostra quantas manilhas já saíram na mão |
| `caraDePau` | Cara de Pau | Depois de correr, seu próximo truco parece 30% mais forte para os rivais |
| `bisbilhoteiro` | Bisbilhoteiro | Revela 1 carta aleatória de um rival por mão |
| `viraViciada` | Vira Viciada | 25% de chance de a vira tornar manilha uma carta da sua mão |
| `reiDaMesa` | Rei da Mesa | Toda mão começa valendo 3 |
| `rendaExtra` | Renda Extra | +$1 ao vencer uma mão que ninguém trucou |
| `naoDouNada` | Não Dou Nada | +25 Fichas se a sua mão não tinha manilha, 3, 2 nem A |
| `figurao` | Figurão | +12 Fichas por vaza vencida com Q, J ou K |
| `coracaoMole` | Coração Mole | +2 Mult por vaza vencida com carta de ♥ |
| `espadachim` | Espadachim | +2 Mult por vaza vencida com carta de ♠ |
| `pauFerro` | Pau-Ferro | +15 Fichas por vaza vencida com carta de ♣ |
| `asNaManga` | Ás na Manga | +20 Fichas por vaza vencida com um A |
| `doisDeOuro` | Dois de Ouro | +18 Fichas por vaza vencida com um 2 |
| `tresSecos` | Três Secos | +2 Mult por vaza vencida com um 3 |
| `saidaBoa` | Saída Boa | +20 Fichas se venceu a 1ª vaza |
| `vazaDoMeio` | Vaza do Meio | +3 Mult se venceu a 2ª vaza |
| `humildade` | Humildade | Correr de uma aposta dá +$2 |
| `apanhouLevantou` | Apanhou, Levantou | +$1 a cada mão perdida |
| `copoAmericano` | Copo Americano | +25 Fichas quando os rivais correm |
| `olharSerio` | Olhar Sério | +2 Mult se você pediu truco |
| `desafio` | Desafio | +$1 quando o seu truco faz os rivais correrem |
| `seisMaldito` | Seis Maldito | ×3 Mult quando a manilha é 6 |
| `caoDeGuarda` | Cão de Guarda | +6 Mult se perdeu a 1ª vaza e venceu a 2ª |
| `contragolpe` | Contragolpe | +6 Mult na Suada |
| `vaiASeis` | Vai a 6? | +40 Fichas quando a aposta é 6 ou mais |
| `parceiroDeAco` | Parceiro de Aço | +4 Mult se o parceiro pediu truco |
| `confiaEmMim` | Confia em Mim | +15 Fichas por vaza vencida pelo parceiro |
| `manilhaDeReserva` | Manilha de Reserva | +4 Mult ao vencer sem ter manilha |
| `peitudo` | Peitudo | +6 Mult ao vencer uma mão que os rivais trucaram |
| `caixaDeFosforo` | Caixa de Fósforo | +$1 por vaza vencida com manilha |
| `ouTudoOuNada` | Ou Tudo ou Nada | ×3 Mult quando a aposta é 9 ou mais |
| `viraDourada` | Vira Dourada | ×1,5 Mult por vaza vencida com manilha |
| `blefeProfissional` | Blefe Profissional | ×2 Mult ao vencer depois de pedir truco sem manilha |
| `caraDeTacho` | Cara de Tacho | +$3 ao perder uma mão em que você pediu truco |
| `duplaQuasePerfeita` | Dupla Quase Perfeita | ×2 Mult quando você e o parceiro venceram uma vaza cada |
| `quedaLivre` | Queda Livre | ×2 Mult na Queda |
| `trucoDeBoteco` | Truco de Boteco | ×2 Mult quando a sua dupla pediu ou aumentou duas vezes |
| `cartaNaManga` | Carta na Manga | ×2 Mult na Virada |
| `faxina` | Faxina | ×1,5 Mult na Vaza Limpa |
| `zapDeOuro` | Zap de Ouro | ×3 Mult ao vencer com o zap na mão |
| `maoDeOuro` | Mão de Ouro | ×4 Mult quando você tinha 2 manilhas |
| `dozeOuNada` | Doze ou Nada | ×5 Mult quando a aposta é 12 |
| `lendaDoBoteco` | Lenda do Boteco | ×1,5 Mult por vaza vencida |

### Chefes (8 no pool + Rei do Truco)

| id | Nome | Regra |
| --- | --- | --- |
| `valentao` | O Valentão | Os rivais pedem truco em toda mão |
| `cartomante` | A Cartomante | A vira fica oculta até o fim da 1ª vaza |
| `juiz` | O Juiz | A Manha mais à esquerda fica desativada |
| `agiota` | O Agiota | Cada mão perdida custa $1 |
| `delegado` | O Delegado | O Lance Corrida vale metade |
| `professor` | Stuart | Os contras dos seus trinkets equipados contam em dobro |
| `mudo` | Peter | Sem sinais com o parceiro |
| `sortuda` | A Sortuda | Os rivais recebem manilha com mais frequência |
| `reiDoTruco` | O Rei do Truco | Toda mão começa valendo 3 |

### Companheiros (10)

| id | Nome | Vantagem | Defeito |
| --- | --- | --- | --- |
| `tonhao` | Bruto | +3 Mult por vaza que ele vence | As cartas dele valem metade das Fichas |
| `donaCida` | Cida | +$1 por mão vencida | Itens da loja custam +$1 |
| `zeMalandro` | Jhony | Juros: +$1 a cada $5 guardados no fim de cada mesa (máx +$5) | A recompensa de Rapidez cai pela metade (arredonda para baixo) |
| `juninho` | Nino | Sobe 1 nível a cada mesa vencida: +1 Mult base por nível | Começa a run com -1 Mult base |
| `ze` | Zé | O item mais barato da primeira loja de cada Campeonato sai de graça | 1 espaço de trinket a menos |
| `bia` | Mia | Manilhas valem +15 Fichas | Cartas comuns valem -2 Fichas |
| `joca` | Chico | +20 Fichas por vaza vencida com carta de paus | Copas e ouros valem -5 Fichas |
| `lurdes` | Beti | O primeiro trinket comprado em cada loja custa $1 a menos | Trinkets custam +$1 |
| `tiao` | Ayla | ×1,5 Mult quando a dupla vence as duas primeiras vazas | Mão perdida custa $1 |
| `neide` | Sheila | 1 chance em 4 de dobrar o dinheiro ganho na mesa | Meta de pontos da mesa +10% |

### Baralhos (5)

| id | Nome | Efeito |
| --- | --- | --- |
| `normal` | Baralho Normal | Sem alteração |
| `interior` | Baralho do Interior | 4, 5 e 6 dão ×2 Fichas |
| `blefe` | Baralho do Blefe | +1 sinal por mão |
| `dinheiro` | Baralho do Dinheiro | +$10 no início; −1 espaço de trinket |
| `viciado` | Baralho Viciado | Uma cópia extra de cada carta de ♣: mais zaps na mesa |

### Feitos (37)

| id | Nome | Condição | Desbloqueia |
| --- | --- | --- | --- |
| `primeiraMao` | Primeira mão | Pontue uma mão |  |
| `cemPontos` | Centena | Faça 100 pontos numa mão |  |
| `milPontos` | Milhar | Faça 1.000 pontos numa mão |  |
| `dezMil` | Dez mil | Faça 10.000 pontos numa mão |  |
| `doze` | Doze! | Vença uma mão de valor 12 (destrava Manhas lendárias) | `legendary` |
| `ferro` | Mão de Ferro | Vença a mão de ferro (destrava o Baralho Viciado) | `deck:viciado` |
| `lixo` | Lixo de luxo | Vença sem manilha, 3, 2 nem A (destrava o Baralho do Interior) | `deck:interior` |
| `blefe` | Cara de paisagem | Vença depois de um truco sem manilha (destrava o Baralho do Blefe) | `deck:blefe` |
| `queda` | Queda | Faça uma Queda |  |
| `virada` | Virada | Vença uma Virada |  |
| `onze` | Mão de 11 | Vença uma mão de 11 |  |
| `mesaPerfeita` | Mesa limpa | Vença uma mesa com os rivais a 0 tentos |  |
| `chefe` | Chefe no chão | Vença um chefe |  |
| `valentao` | Sem medo | Vença O Valentão |  |
| `professor` | Lição aprendida | Vença Stuart |  |
| `sortuda` | Acabou a sorte | Vença A Sortuda |  |
| `campeonato2` | Pé na estrada | Chegue ao Campeonato 2 |  |
| `campeonato4` | Sócio do clube | Chegue ao Campeonato 4 (destrava o Nino) | `partner:juninho` |
| `campeonato6` | Fama regional | Chegue ao Campeonato 6 |  |
| `reiDoTruco` | Rei do Truco | Vença uma run |  |
| `comTonhao` | Amigão | Vença uma run com o Bruto |  |
| `comDonaCida` | A tia sabe | Vença uma run com a Cida |  |
| `comZe` | Jogo de cintura | Vença uma run com o Jhony |  |
| `comJuninho` | comJuninho |  |  |
| `doInterior` | Campeão do interior | Vença uma run com o Baralho do Interior |  |
| `doDinheiro` | Dinheiro fala | Vença uma run com o Baralho do Dinheiro |  |
| `estaca4` | Ficando sério | Vença uma run na Estaca 4 |  |
| `estaca8` | Intocável | Vença uma run na Estaca 8 |  |
| `infinito` | Sem fim | Chegue ao Campeonato 10 no modo infinito |  |
| `rico` | Endinheirado | Tenha $30 (destrava o Baralho do Dinheiro) | `deck:dinheiro` |
| `lendario` | Lenda | Tenha uma Manha lendária |  |
| `baralhoMagro` | Baralho magro | Jogue com 25 cartas ou menos |  |
| `baralhoGordo` | Baralho gordo | Jogue com 50 cartas ou mais |  |
| `cemMaos` | Freguesia | Vença 100 mãos |  |
| `trucador` | Trucador | Peça truco 100 vezes |  |
| `mentiroso` | Mentiroso | Vença 5 blefes (destrava o Jhony) | `partner:zeMalandro` |
| `fregues` | De volta | Jogue 10 runs |  |
