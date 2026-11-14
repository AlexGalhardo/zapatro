# Lançamento: Zapatro

> **Data/versão:** 2026-10-25 · jogo em `0.10.0` (`package.json`) · documento v2.
> **Status:** sintetiza os antigos `deploy-steam.md`, `deploy-google-play.md`, `deploy-itch-io.md` e `deploy-poki.md`. Nenhuma loja publicada ainda. Valores, prazos e taxas conhecidos em 2026-10: confira na documentação de cada loja antes de pagar ou aceitar termos.
> **Fonte da verdade para:** o passo a passo de publicação e atualização em Steam, Google Play, itch.io e Poki. Parte técnica dos builds: [desktop.md](desktop.md) (Electron, conquistas, Steam Cloud), [mobile.md](mobile.md) (Capacitor, Gradle, emulador), [site.md](site.md) (site). Gates e versão: skill `release-section`.

## 1. Visão geral

| Loja | Build enviado | Modelo | Estado | Link |
|---|---|---|---|---|
| Steam (Windows, macOS, Linux, Steam Deck) | Pastas do Electron (`win-unpacked/`, `linux-unpacked/`, `mac-arm64/`) dos zips `zapatro_*_{windows,linux,darwin}_*.zip` | Pago (PLAN Q-02: US$ 9,99); US$ 100 de Steam Direct; Valve fica com 30% | Material pronto; conta e página pendentes (humano) | `steam` em `site/src/links.ts` (vazio) |
| Google Play (Android) | `zapatro_<versão>_android.aab` assinado com a chave de upload | Gratuito ou pago (decidir antes: PLAN Q-02); US$ 25 únicos | Material pronto; conta e página pendentes (humano) | `play` em `site/src/links.ts` (vazio) |
| itch.io | `zapatro_<versão>_web-demo.zip` (navegador) + zips do Electron + APK assinado | Demo grátis; completo pago ou "Name your own price"; itch fica com 10% (ajustável até 0%) | Material pronto; página pendente (humano) | `itch` em `site/src/links.ts` (vazio) |
| Poki | `zapatro_<versão>_web-poki.zip` (demo) | Grátis com anúncios; divisão da receita de anúncios; a Poki escolhe quem publica | Build pronto; candidatura pendente (humano) | URL dada pela Poki |
| Site próprio | `/play` = jogo completo, `/demo` = demo até o primeiro chefe | Grátis | No ar | <https://alexgalhardo.github.io/zapatro/> |

Ordem sugerida: itch.io (minutos, sem revisão, bom para playtest) → página "Em breve" da Steam (precisa de ≥ 2 semanas no ar) e conta da Play (≥ 3 semanas até a produção) em paralelo → Poki (candidatura, semanas de resposta).

Skills de apoio: `gd-steam-publish`, `gd-itch-publish`, `platform-builds`, `release-section`.

### 1.1 Estado em 2026-10-25

Feito (no repositório):

- **Arte de loja e presskit** gerados pelo jogo em [`media/`](media/): `bun scripts/store-art.ts` (capsules Steam, feature e ícone da Play, capa do itch, Open Graph, logos) e `bun scripts/store-shots.ts [url] [en|pt-BR]` (6 capturas 1920×1080 por idioma). Ver a tabela de arquivos em [store-page.md](store-page.md).
- **Textos da página** em EN e PT-BR, dados da página e requisitos de sistema: [store-page.md](store-page.md).
- **Builds**: zips web (completo, demo e Poki), Electron e AAB/APK pelo GitHub Release (skill `release-section`); ícones dos apps (`bun run app-icons`).
- **Poki SDK** integrado (`src/core/poki.ts`) e build `VITE_POKI=1` (`bun run build:poki`).
- **Política de privacidade** no ar: `https://alexgalhardo.github.io/zapatro/privacy/`.

Pendência humana (conta, dinheiro, decisão ou assinatura; o repositório não faz):

- **Steam:** conta Steamworks, Steam Direct (US$ 100), entrevista fiscal (W-8BEN) e verificação de identidade; App ID, depots e conquistas no Steamworks; usuário de build; página "Em breve" e revisão; preço (PLAN Q-02, US$ 9,99 provisório). Nenhum App ID foi criado.
- **Google Play:** conta de desenvolvedor (US$ 25) e verificação; chave de upload (`.jks`) e secrets `ANDROID_KEYSTORE_*`; questionário IARC, segurança dos dados e público-alvo; teste fechado com 12 testadores por 14 dias; decisão gratuito ou pago (não muda depois).
- **itch.io:** criar a página, enviar os zips e definir o preço.
- **Poki:** candidatura e contrato, com a decisão sobre exclusividade web (§6, conflito em aberto).
- **Assinatura:** o `.exe` do Windows não tem certificado de código (o SmartScreen avisa); a notarização do macOS também depende de conta Apple. Decisão e custo humanos.
- **Licenças:** confirmar o plano pago do PixelLab e do ElevenLabs para uso comercial ([CREDITS.md](../CREDITS.md)).
- **Marca:** verificar o nome e o logo "Zapatro" antes de publicar.
- **Datas:** nenhuma data de lançamento definida ("A definir" na página).
- **A conferir antes da Steam:** o §3.3 deste doc cita 400 MB de disco, e o [store-page.md](store-page.md) cita 200 MB. Escolher um valor e alinhar os dois.
- **Nome do executável:** os §3.2 e §5.2 usam `Zapaco.exe` e `zapaco`; o produto é Zapatro. Conferir o nome real gerado pelo electron-builder antes de criar as Launch Options.

## 2. Checklist comum antes de qualquer loja

1. **Versão, tag e release.** A versão mora só no `package.json` raiz. Corrija, rode os gates e crie a tag pela skill `release-section`. O GitHub Release da tag traz os arquivos:
   - `bun run release` (local) anexa os zips web (`zapatro_<versão>_web.zip`, `_web-demo.zip`, `_web-poki.zip`), o Electron Windows (rodando no Windows) e Linux, o APK de debug e `checksums.txt`;
   - o Electron macOS e o AAB/APK **assinados** só vêm do `release.yml` (tag `v*` no GitHub Actions; assina se existirem os secrets `ANDROID_KEYSTORE_*`, ver §4.1).
2. **Builds conferidos.** Os zips web já têm o `index.html` na raiz (não a pasta `dist/`). Build local do Electron só gera o sistema atual e falha dentro do OneDrive (`EPERM ... rename win-unpacked.tmp`): use os zips do Release.
3. **Presskit e textos.** Descrições curta e longa, em EN e PT-BR, estão em [store-page.md](store-page.md) (o presskit do site espelha os mesmos textos). Destaque: Truco Paulista 2×2, roguelite, Fichas × Mult, 8 Campeonatos, chefes.
4. **Imagens.** Arte de loja pronta em [`media/`](media/) (gerada por `bun scripts/store-art.ts`; o wordmark já vem desenhado). Capturas 1920×1080 em `media/store-shot-0N-*-<lang>.png`, geradas por `bun scripts/store-shots.ts` a partir do build de produção (`bun run build` e `bunx --bun vite preview --port 4173`). Trailer em `trailer/out/` (EN e PT, 1080p60) e no YouTube.
5. **Privacidade e conteúdo.** Política de privacidade: `https://alexgalhardo.github.io/zapatro/privacy/`. Nenhum dado coletado nem compartilhado; o save fica só no aparelho. Sem anúncios (exceto no build Poki), sem login, sem violência nem conteúdo adulto. As "apostas" são pontos sem valor real: responda **não** a jogos de azar com dinheiro real em todo questionário.
6. **IA.** Arte e áudio gerados por IA (PixelLab e ElevenLabs): declare onde a loja pedir (o itch exige).
7. **Fiscal.** Pessoa física no Brasil preenche o **W-8BEN** (Steam, itch se vender, Poki). Declare a receita no Brasil; confira com um contador.
8. **Segredos fora do repo:** keystore Android (`*.jks`) e senhas, `C:\steamcmd\config\config.vdf`, token do `butler`. Nunca commite.
9. **Depois de cada loja no ar:** preencha a chave em `site/src/links.ts` e faça push na `main` (o `deploy.yml` publica o site).

## 3. Steam (Windows, macOS, Linux e Steam Deck)

Confira na [documentação do Steamworks](https://partner.steamgames.com/doc/home) antes de pagar. Parte técnica em [desktop.md](desktop.md).

| Item | Valor |
|---|---|
| Arquivos enviados | Pastas do Electron: `win-unpacked/`, `linux-unpacked/`, `mac-arm64/`, dos zips `zapatro_*_{windows,linux,darwin}_*.zip` do GitHub Release |
| Ferramenta de envio | SteamCMD + `desktop/steam/app_build.vdf` |
| Custo | US$ 100 por jogo (Steam Direct), devolvidos depois de US$ 1.000 em vendas |
| Prazos obrigatórios | 30 dias entre o pagamento e o lançamento (primeiro jogo da conta). Página "Em breve" no ar por **≥ 2 semanas**. Revisões de 3–5 dias úteis |
| Taxa da Valve | 30% das vendas (menos acima de US$ 10 mi) |

| Semana | O que acontece |
|---|---|
| 1 | Conta + pagamento |
| 2 | Página enviada para revisão |
| 3 | Página "Em breve" no ar, wishlists começam |
| 4–5 | Build enviado e revisado |
| ≥ 5 | Lançamento |

### 3.1 Conta de parceiro (uma vez, 2–7 dias)

1. Acesse <https://partner.steamgames.com> e entre com a sua conta Steam.
2. Faça *Join Steamworks* e aceite o **Steam Distribution Agreement**.
3. **Informações bancárias:** conta que recebe em dólar. Funciona conta brasileira com SWIFT ou um serviço como Wise ou Payoneer.
4. **Entrevista fiscal:** W-8BEN. Não há tratado de bitributação Brasil–EUA, então a Valve retém 30% de imposto americano sobre a sua parte. Confira no formulário e com um contador.
5. **Verificação de identidade:** documento com foto.
6. Pague o **Steam Direct** (US$ 100) e anote o **App ID** que aparece.

### 3.2 Configurar o app (~1 h)

1. *App Admin → (seu app) → SteamPipe → Depots*. Crie 3 depots e anote os IDs: **Windows** (64 bits), **Linux** (o Steam Deck usa este) e **macOS**. Em cada um, marque o *Operating System* certo.
2. Edite `desktop/steam/app_build.vdf`. Troque `1000` → App ID, `1001` → depot Windows, `1002` → depot Linux, `1003` → depot macOS. Os IDs não são segredos e podem ir para o commit.
3. *Installation → General → Launch Options*. Crie uma opção por sistema:

   | Sistema | Executable | Arguments |
   |---|---|---|
   | Windows | `Zapaco.exe` | (vazio) |
   | Linux (+ Steam Deck) | `truco-roguelite` | `--no-sandbox` |
   | macOS | `Zapaco.app` | (vazio) |

4. *Associated Packages & DLC*: adicione os 3 depots ao pacote principal do jogo. Sem isso, a instalação no Mac e no Linux sai vazia.
5. **Conquistas** (*Stats & Achievements*): crie uma por feito. A tabela de API Names está em [desktop.md](desktop.md#steamworks-conquistas-e-steam-cloud-b51). Ícones 256×256 vêm de `art-src/`. Depois preencha `"steamAppId"` em `desktop/package.json` com o App ID.
6. **Steam Cloud** (*Steam Cloud → Settings*): defina uma cota (1 MB por usuário basta) e os **Root Overrides** do Auto-Cloud descritos em [desktop.md](desktop.md#steamworks-conquistas-e-steam-cloud-b51).
7. Aba **Publish → Prepare for Publishing → Publish to Steam**. Configuração não publicada não vale.
8. Crie um **usuário de build** (*Users & Permissions → Manage Users*): uma conta Steam separada, só com *Edit App Metadata* e *Publish App Changes To Steam* neste app. Nunca use a conta principal no SteamCMD.

### 3.3 Página da loja "Em breve" (2–3 h + revisão)

*Store Admin → Edit Store Page*:

1. **Descrição** curta e longa, em EN e PT-BR (§2 item 3).
2. **Gráficos** (`art-src/capsules/` foi removido; use os `media/store-*.png`, logo por cima antes de enviar):

   | Arte | Tamanho | Fonte |
   |---|---|---|
   | Header capsule | 920×430 | `media/store-steam-header.png` |
   | Small capsule | 462×174 | `media/store-steam-small.png` |
   | Main capsule | 616×353 | `media/store-steam-main.png` |
   | Vertical capsule | 748×896 | `media/store-steam-vertical.png` |
   | Library capsule | 600×900 | `media/store-steam-library.png` |
   | Library hero | 3840×1240 | `media/store-steam-hero.png` (sem logo nem texto) |
   | Library logo | 1280×720, PNG transparente | `media/store-steam-logo.png` |
   | Ícone do app / comunidade | 184×184 / 32×32 | `desktop/build/icon.png` reduzido |

   Confira a lista atual em *Graphical Assets*; a Valve muda tamanhos às vezes.
3. **Capturas:** mínimo 5, em 1920×1080: `media/store-shot-0N-*-en.png` (6 cenas em EN, de `store-shots.ts`). Capturas de partida contam mais que menus.
4. **Trailer:** `trailer/out/` (EN e PT, 1080p60), em *Trailers*.
5. **Tags:** Card Game, Roguelite, Deckbuilding, Pixel Graphics, Strategy, Turn-Based, Singleplayer.
6. **Idiomas:** English e Portuguese - Brazil, com *Interface* e *Subtitles* marcados e *Full Audio* desmarcado.
7. **Requisitos mínimos:** Windows 10 64-bit; 4 GB de RAM; GPU com WebGL 2; 400 MB de disco. macOS 12+ (Apple Silicon); Ubuntu 22.04+.
8. **Questionário de conteúdo:** jogo de cartas, sem violência nem conteúdo adulto. Responda **não** a "gambling" com dinheiro real.
9. *Coming Soon*: escolha a data "To be announced" ou um trimestre.
10. Envie para revisão. Depois de aprovada, clique **Release Coming Soon Page**. A partir daí contam as 2 semanas mínimas, e as wishlists começam.
11. Com a página no ar:
    - preencha `steam` em `site/src/links.ts` e faça push na `main` (o `deploy.yml` publica o site);
    - troque `STORE_URL` em `src/core/platform.ts` pela URL da loja (`https://store.steampowered.com/app/<AppID>/`). Hoje esse valor é uma busca provisória e alimenta o botão "Wishlist" do fim da demo.

### 3.4 Enviar o build (~1 h)

1. Instale o **SteamCMD**: <https://developer.valvesoftware.com/wiki/SteamCMD>. No Windows, extraia em `C:\steamcmd\`.
2. Baixe os 3 `zapatro_*_{windows,linux,darwin}_*.zip` do GitHub Release da versão e descompacte cada um em `desktop/release/`, nas pastas `win-unpacked`, `linux-unpacked` e `mac-arm64`. `bun run electron:build` local também funciona, mas só para o sistema atual e fora do OneDrive (§2 item 2).
3. **Ensaio:** ponha `"Preview" "1"` no `app_build.vdf` e rode:

   ```powershell
   C:\steamcmd\steamcmd.exe +login <usuario_de_build> +run_app_build "C:\...\jogo-truco\desktop\steam\app_build.vdf" +quit
   ```

   O primeiro login pede o código do Steam Guard. O token fica em `C:\steamcmd\config\config.vdf`. Ele é **segredo**: nunca commite.
4. Se o ensaio listar os arquivos certos, volte para `"Preview" "0"` e rode de novo para enviar.
5. *SteamPipe → Builds*: o build aparece com a descrição `Zapatro`.
   - Crie a branch `beta` com senha e coloque o build nela.
   - Instale pela Steam (*Propriedades → Betas → senha*) e teste no Windows e, se puder, no Linux/Steam Deck e no Mac.
   - Teste: abre, joga uma mão, conquista aparece, fechar/abrir mantém o save.
6. Quando estiver bom, mova o build para a branch **`default`** (manualmente; o script não faz isso).
7. *Release → Review*: envie o build para revisão (3–5 dias úteis).

### 3.5 Lançamento

1. Precisa de três coisas: a página aprovada há ≥ 2 semanas, o build aprovado e os 30 dias desde o pagamento cumpridos.
2. **Preço** (*Pricing*): base em USD (PLAN Q-02: US$ 9,99). Aceite os preços regionais sugeridos. Configure um desconto de lançamento opcional (10–20%) com antecedência.
3. Clique **Release App** em *Release*. O lançamento é sempre manual e o jogo fica visível em minutos.
4. Opcional: peça a verificação de **Steam Deck**. A Valve testa sozinha depois do lançamento; o jogo já tem gamepad e 1280×800.

### 3.6 Atualizações

1. Nova tag (§2 item 1); o GitHub Release traz os zips.
2. Repita §3.4, passos 2–6. Não precisa de nova revisão para patches.
3. Publique as notas em *Community → Events & Announcements*, com o trecho do CHANGELOG.

### 3.7 Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Mac/Linux instala sem arquivos | Depots fora do pacote. Veja §3.2 passo 4 e publique |
| "Failed to get application info" ao jogar | Configuração não publicada. Use *Publish → Publish to Steam* |
| Linux abre e fecha na hora | Falta `--no-sandbox` nas Launch Options do Linux |
| Conquistas não aparecem | `steamAppId` ainda `null` em `desktop/package.json`, ou conquistas não publicadas no Steamworks |
| SteamCMD pede Steam Guard toda vez | Apagou `config/config.vdf`. Faça login de novo uma vez |
| `EPERM ... rename win-unpacked.tmp` | Build local dentro do OneDrive. Use os zips do Release |

## 4. Google Play (Android)

Confira na [Play Console Help](https://support.google.com/googleplay/android-developer) antes de pagar ou enviar. Parte técnica em [mobile.md](mobile.md).

| Item | Valor |
|---|---|
| Pacote (`appId`) | `com.alexgalhardo.trucoroguelite` (**nunca mude**: o save e as atualizações dependem dele) |
| Arquivo enviado | `zapatro_<versão>_android.aab` (AAB assinado com a chave de upload) |
| Custo | US$ 25, taxa única da conta de desenvolvedor |
| Tempo mínimo até a produção | ~3 semanas em conta pessoal nova: 14 dias de teste fechado com 12 testadores + revisão |
| Versão | Vem do `package.json` raiz; o `versionCode` cresce sozinho (`scripts/lib/version-code.ts`) |

### 4.1 Chave de upload (uma vez, ~10 min)

A Play usa o **Play App Signing**: você assina o AAB com a sua **chave de upload**; o Google guarda a chave final do app e assina o que vai para os celulares. Se você perder a chave de upload, a Play Console pode redefini-la. Mesmo assim, guarde bem.

1. Crie a chave com o JDK 21, numa pasta **fora do repositório** (por exemplo `C:\chaves\`):

   ```powershell
   & "$env:LOCALAPPDATA\Programs\jdk-21\bin\keytool.exe" -genkeypair -v -keystore C:\chaves\zapaco-upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   ```

   O comando pede uma senha e seus dados (nome, cidade, país `BR`).
2. Guarde num gerenciador de senhas: o arquivo `zapaco-upload.jks`, a senha da keystore, o alias `upload` e a senha da chave (por padrão, a mesma da keystore).
3. Crie os secrets do GitHub. Cada `gh secret set` sem valor pede o texto escondido:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\chaves\zapaco-upload.jks")) | gh secret set ANDROID_KEYSTORE_BASE64
   gh secret set ANDROID_KEYSTORE_PASSWORD
   gh secret set ANDROID_KEY_PASSWORD
   "upload" | gh secret set ANDROID_KEY_ALIAS
   ```

4. Gere uma tag nova (`release-section`). O job `android` do `release.yml` passa a anexar ao GitHub Release `zapatro_<versão>_android.aab` (para a Play) e `zapatro_<versão>_android.apk` assinado (para instalar direto e para o itch). Sem os secrets, ele publica só o APK de debug.

Build assinado local, opcional:

```powershell
$env:ANDROID_KEYSTORE_PATH = "C:\chaves\zapaco-upload.jks"
$env:ANDROID_KEYSTORE_PASSWORD = "..."; $env:ANDROID_KEY_ALIAS = "upload"; $env:ANDROID_KEY_PASSWORD = "..."
$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\jdk-21"
bun run android:bundle   # → mobile/android/app/build/outputs/bundle/release/app-release.aab
```

### 4.2 Conta de desenvolvedor (uma vez, 1–3 dias)

1. Acesse <https://play.google.com/console> e entre com a conta Google que vai ser a dona do jogo.
2. Escolha conta **Pessoal**. Em conta **Organização**, você precisa de um CNPJ e de um número D-U-N-S, mas não precisa do teste fechado de 14 dias.
3. Pague os US$ 25 e envie o documento para verificar a identidade. A aprovação leva de horas a alguns dias.
4. Verifique também um celular Android real. A Play Console pede isso para contas novas.
5. Configure o **perfil de pagamentos** só se o jogo for pago: *Configurações → Perfil de pagamentos* pede dados bancários e fiscais.

### 4.3 Criar o app (~1 h)

1. *Todos os apps → Criar app*:
   - Nome: **Zapatro**.
   - Idioma padrão: **English (United States)**. Depois adicione **Português (Brasil)**.
   - Tipo: **Jogo**.
   - **Gratuito ou pago:** é possível mudar de pago para gratuito, mas **nunca de gratuito para pago**. Decida antes (PLAN Q-02).
   - Aceite as declarações.
2. No *Painel*, preencha **Configurar o app**. Todos os itens são obrigatórios:

   | Item | Resposta para o Zapatro |
   |---|---|
   | Política de privacidade | `https://alexgalhardo.github.io/zapatro/privacy/` |
   | Acesso ao app | Todo o app fica disponível sem login |
   | Anúncios | Não contém anúncios |
   | Classificação do conteúdo | Questionário IARC. Categoria **Jogo**. Sem violência real, sem conteúdo sexual e sem apostas com dinheiro real: responda **não** a jogos de azar com dinheiro real |
   | Público-alvo | 13+ (evita as regras de app infantil) |
   | Segurança dos dados | **Nenhum** dado coletado nem compartilhado. O save fica só no aparelho |
   | App do governo / notícias / saúde | Não |
   | Recursos financeiros | Nenhum |

3. **Página principal da loja** (*Aumentar o número de usuários → Presença na loja*), em EN e depois em PT-BR:
   - Título (≤ 30 caracteres): `Zapatro: Truco Roguelite`.
   - Descrição curta (≤ 80) e completa (≤ 4000), do presskit.
   - Ícone 512×512 PNG: `mobile/assets/play-store-icon-512.png`.
   - Gráfico de recurso 1024×500: `media/store-play-feature.png` (já com o wordmark, sem alpha).
   - 2 a 8 capturas de celular em paisagem 16:9: `media/store-shot-*-<lang>.png`. Capturas de tablet são opcionais.
   - Vídeo: URL do trailer no YouTube (opcional).
   - Categoria: **Jogos → Cartas**. Tags: cartas, roguelike, estratégia.
   - E-mail de contato (obrigatório, público).

### 4.4 Teste interno (~30 min, sem revisão demorada)

1. *Testar e lançar → Testes → Teste interno → Criar nova versão*.
2. Aceite o **Play App Signing**: "Usar chave gerada pelo Google".
3. Envie o `zapatro_<versão>_android.aab` baixado do GitHub Release.
4. Nas notas da versão, cole o trecho do CHANGELOG. *Salvar → Revisar versão → Iniciar lançamento*.
5. Na aba *Testadores*, crie uma lista com o seu e-mail e copie o **link de participação**.
6. Abra o link no celular, aceite e instale pela Play.
7. Teste no aparelho: abre em paisagem; o toque funciona; o botão voltar pausa; o áudio toca; o save sobrevive a fechar o app.

### 4.5 Teste fechado (14 dias, obrigatório em conta pessoal nova)

1. *Testes → Teste fechado → Criar faixa* (ou use a faixa "Alpha").
2. Promova a versão do teste interno ou envie o AAB de novo.
3. Adicione **pelo menos 12 testadores** por e-mail (lista ou Grupo do Google). Eles precisam aceitar o convite e **ficar inscritos 14 dias seguidos**. Chame 15 ou mais, porque alguns saem no meio.
4. Lance e envie o link para os testadores.
5. Durante os 14 dias, olhe *Android vitals* (falhas e ANRs) e o **relatório de pré-lançamento** (testes automáticos do Google em aparelhos reais).
6. No fim, *Painel → Solicitar acesso à produção*. Responda o questionário sobre o teste. A resposta leva até ~7 dias.

### 4.6 Produção

1. *Produção → Criar nova versão* → promova a versão do teste fechado.
2. *Países/regiões*: todos, ou comece por Brasil e EUA.
3. *Revisar versão → Iniciar lançamento*. Use **lançamento gradual** (por exemplo, 20%), acompanhe as falhas por 1–2 dias e suba para 100%.
4. A revisão do Google leva de horas a alguns dias. Quando aprovar, preencha `play` em `site/src/links.ts` com `https://play.google.com/store/apps/details?id=com.alexgalhardo.trucoroguelite` e faça push na `main` (o `deploy.yml` publica o site).

### 4.7 Atualizações

1. Nova tag (§2 item 1) e baixe o AAB novo do GitHub Release.
2. Na faixa desejada, crie uma nova versão com o AAB. A Play recusa um `versionCode` igual ou menor; o script já garante que ele cresce.
3. Uma vez por ano, a Play aumenta o `targetSdk` mínimo (hoje 36, em `mobile/android/variables.gradle`). Quando avisarem, atualize o Capacitor.

### 4.8 Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| "Você enviou um APK ou Android App Bundle assinado com a chave errada" | AAB assinado com outra chave de upload. Use sempre o mesmo `.jks`. Se perdeu, *Configuração → Integridade do app → Solicitar redefinição da chave de upload* |
| "O código de versão já foi usado" | Mesma versão no `package.json`. Suba a versão e gere uma tag nova |
| Botão de produção bloqueado | Conta pessoal nova sem os 14 dias de teste fechado com 12 testadores |
| `Unsupported class file major version` no build local | Java errado. Aponte `JAVA_HOME` para o JDK 21 |
| APK "package appears to be invalid" | `app-release-unsigned.apk`. Use o APK assinado do Release ou `bun run android:debug` |

## 5. itch.io (demo web + downloads)

A loja mais simples: sem taxa, sem revisão obrigatória, publicada em minutos. Boa para a demo web e para playtest antes da Steam. Confira em <https://itch.io/docs/creators>.

| Item | Valor |
|---|---|
| Jogável no navegador | `zapatro_<versão>_web-demo.zip` (demo, Campeonato 1 até o primeiro chefe) ou `zapatro_<versão>_web.zip` (completo) |
| Downloads | `zapatro_<versão>_windows_amd64.zip`, `_darwin_arm64.zip`, `_linux_amd64.zip`; Android: `zapatro_<versão>_android.apk` (assinado, §4.1) |
| Custo | Grátis. O itch fica com uma porcentagem que você escolhe (padrão 10%, pode ser 0%) |
| Ferramenta opcional | `butler` (CLI oficial do itch) para enviar e atualizar sem o navegador |

### 5.1 Conta (uma vez, ~10 min)

1. Crie a conta em <https://itch.io/register>. O nome de usuário vira a URL: `https://<usuario>.itch.io/zapaco`.
2. *Settings → Profile*: confirme o e-mail.
3. Se for vender algo, *Settings → Payouts*: escolha PayPal ou transferência bancária e responda a **entrevista fiscal** (W-8BEN). Para um jogo grátis, pode pular.

### 5.2 Criar a página (~45 min)

1. *Dashboard → Create new project*.
2. Preencha:

   | Campo | Valor |
   |---|---|
   | Title | `Zapatro` |
   | Project URL | `zapaco` |
   | Short description | `A Truco Paulista roguelite` |
   | Classification | **Games** |
   | Kind of project | **HTML** (o jogo roda no navegador; os executáveis entram como downloads extras) |
   | Release status | **In development** (demo/RC) ou **Released** (1.0) |
   | Pricing | Demo: **No payments**. Jogo completo: **Paid** (por exemplo, US$ 9,99) ou **Name your own price** com mínimo |

3. **Uploads:**
   1. Envie `zapatro_<versão>_web-demo.zip` e marque **"This file will be played in the browser"**.
   2. Envie os zips do Electron e o APK. Marque o sistema de cada um (Windows, macOS, Linux, Android).
4. **Embed options** (aparecem depois de enviar o zip web):
   - Viewport: **1280 × 720**;
   - **Mobile friendly** marcado, orientação **Landscape**;
   - **Automatically start on page load** desmarcado: deixe "Click to launch" para o áudio liberar;
   - **Fullscreen button** marcado;
   - **Enable scrollbars** desmarcado.
5. **Details:**
   - Description: texto do presskit em EN, com um bloco em PT-BR. Embuta o trailer do YouTube.
   - Genre: **Card Game**. Tags: `roguelite`, `deckbuilding`, `card-game`, `pixel-art`, `truco`, `brazil`.
   - AI generation disclosure: **marque que usa arte e áudio gerados por IA** (PixelLab e ElevenLabs). O itch exige essa declaração.
   - Cover image 630×500: `media/store-itch-cover.png`.
   - Screenshots: 3–5, de `media/store-shot-*-<lang>.png`.
   - Links: site (`https://alexgalhardo.github.io/zapatro/`) e, depois, Steam e Play.
6. **Visibility & access:**
   1. Comece com **Draft** e abra a página pelo link de pré-visualização.
   2. Jogue a demo no PC e no celular: carrega, áudio, tela cheia, save.
   3. Depois troque para **Public**.
7. *Save*. Depois preencha `itch` em `site/src/links.ts` com a URL, faça push na `main` (o `deploy.yml` publica o site) e registre a URL em PLAN RC4.4.

### 5.3 Atualizações com butler (recomendado)

O `butler` envia só a diferença entre versões. Os jogadores do app do itch recebem a atualização automática.

1. Baixe em <https://itch.io/docs/butler/installing.html> e faça login uma vez com `butler login`. O token fica no perfil do usuário. É segredo: nunca commite.
2. Envie cada build num **canal**. Os zips vêm do GitHub Release da versão; descompacte antes, porque o butler envia pastas:

   ```powershell
   butler push .\web-demo      <usuario>/zapaco:html5      --userversion 1.0.0-rc.2
   butler push .\win-unpacked  <usuario>/zapaco:windows    --userversion 1.0.0-rc.2
   butler push .\mac-arm64     <usuario>/zapaco:mac        --userversion 1.0.0-rc.2
   butler push .\linux-unpacked <usuario>/zapaco:linux     --userversion 1.0.0-rc.2
   ```

   Troque `--userversion` pela versão do `package.json`.
3. No primeiro push de cada canal, volte ao painel e marque o canal `html5` como **"played in the browser"**. Os outros canais ganham o sistema pelo nome.
4. Publique um **Devlog** (*Edit game → Devlogs*) com as notas do CHANGELOG. Quem segue o jogo recebe aviso.

### 5.4 Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Tela preta ou 404 no navegador | Zip com a pasta `dist/` dentro. O `index.html` precisa estar na raiz do zip (os zips do Release já estão assim) |
| Sem som | Normal até o primeiro clique (política do navegador). "Click to launch" resolve |
| Jogo cortado ou com barra de rolagem | Viewport diferente de 1280×720 ou scrollbars ligadas |
| macOS diz "app danificado" | Build sem notarização Apple. O jogador precisa de *botão direito → Abrir* ou `xattr -cr Zapaco.app`. Explique na página ou use só a Steam no Mac |
| Windows mostra SmartScreen | Executável sem certificado de código. "Mais informações → Executar assim mesmo"; explique na página |

## 6. Poki (demo web)

Portal de jogos web gratuitos com anúncios. A receita vem da divisão dos anúncios, e **a Poki escolhe quais jogos publica**: o envio é uma candidatura, não uma publicação garantida. Confira em <https://developers.poki.com> e nos termos antes de aceitar.

> **Conflito em aberto: exclusividade web.** O jogo já está na web em `https://alexgalhardo.github.io/zapatro/play/` (completo) e `/demo` (demo até o primeiro chefe), e vai para o itch.io (§5). Se o contrato da Poki tiver cláusula de exclusividade web, isso pode conflitar. Pergunte à Poki **antes** de assinar (§6.3 passo 2) e decida com o dev; não remova `/play`, `/demo` nem a página do itch sem decisão explícita.

| Item | Valor |
|---|---|
| Arquivo | `zapatro_<versão>_web-poki.zip` do GitHub Release, gerado por `bun run build:poki` (`VITE_DEMO=1 VITE_POKI=1`) |
| Conteúdo | Demo: Campeonato 1 (até o primeiro chefe), sem vozes, ambiências tardias nem `music.king` (D-61) |
| Tamanho | ~4 MB (< 8 MB). A Poki pede download inicial pequeno |
| SDK | Já integrado em `src/core/poki.ts`: `init`, `gameLoadingFinished`, `gameplayStart`/`gameplayStop` em cada mesa |
| Custo | Grátis. A Poki fica com parte da receita de anúncios |

### 6.1 Preparar o build (~15 min)

1. Gere uma tag (`release-section`) ou rode localmente:

   ```powershell
   bun run build:poki   # → dist/ ; zipe o conteúdo de dist/, não a pasta
   ```

2. Teste o zip no **Poki Inspector**, a ferramenta deles que simula o site e o SDK (link no painel de <https://developers.poki.com>). Arraste o zip e confira:
   - [ ] carrega até o menu sem erros no console;
   - [ ] `gameLoadingFinished` dispara no fim do carregamento;
   - [ ] `gameplayStart` dispara ao abrir uma mesa e `gameplayStop` ao sair dela;
   - [ ] funciona no celular (modo toque) e no desktop, em paisagem;
   - [ ] o áudio só começa depois do primeiro clique ou toque.
3. **Ponto a revisar antes do envio:** a tela final da demo tem o botão "Wishlist", que abre a Steam (`openStore()` em `src/core/platform.ts`). Portais costumam recusar links externos para outras lojas. Se a Poki pedir, esconda o botão quando `IS_POKI` for verdadeiro (`src/scenes/RunScene.ts`, tela `demo.wishlist`).
4. **Pausas comerciais**, opcional: a Poki ganha mais com `commercialBreak()` em pausas naturais. No Zapatro, a pausa natural é entre uma mesa e a loja. Hoje o SDK não chama isso; implemente só se a Poki aceitar o jogo e pedir.

### 6.2 Conta e envio (~30 min)

1. Crie a conta em <https://developers.poki.com> (*Sign up*). Use o mesmo e-mail que vai receber os pagamentos.
2. *Create game* → nome **Zapatro** e uma descrição curta em inglês, do presskit.
3. Envie o `zapatro_<versão>_web-poki.zip`. O painel gera uma URL de pré-visualização.
4. Responda o formulário: gênero Card / Strategy; controles mouse, toque e teclado; idiomas EN e PT-BR; orientação paisagem.
5. *Submit for review*. A equipe joga e responde por e-mail em algumas semanas. Ela pode pedir mudanças, como menos tempo até a primeira mesa, um tutorial mais curto ou a remoção de links externos.

### 6.3 Se a Poki aceitar

1. A Poki faz um **teste de mercado** com uma parte do público e olha os dados: tempo de jogo, retenção e conversão do primeiro minuto.
2. Assine o contrato pelo painel. Leia as cláusulas de **exclusividade web** (ver o conflito acima) e de divisão de receita antes de assinar.
3. Configure o pagamento no painel: dados bancários ou PayPal e o formulário fiscal (W-8BEN).
4. A Poki publica o jogo com a página e as imagens dela. Peça a URL final e adicione no site, se quiser.

### 6.4 Atualizações

1. Nova tag (§2 item 1) e baixe o `zapatro_<versão>_web-poki.zip` novo.
2. No painel da Poki, envie a nova versão do jogo. Ela passa por uma checagem rápida antes de ir ao ar.

### 6.5 Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Zip recusado por tamanho | Algo grande entrou no build Poki. Confira `dist/` e as exclusões do D-61 |
| Tela preta no Inspector | Zip com a pasta `dist/` dentro. Zipe o **conteúdo** de `dist/` (o `index.html` na raiz do zip) |
| SDK não carrega | Bloqueador de anúncios. O jogo segue sem o SDK por design; teste sem bloqueador |
| Recusa por "external links" | Esconda o botão "Wishlist" no build Poki (§6.1 passo 3) |

## 7. Depois do lançamento

1. **Links:** cada loja no ar entra em `site/src/links.ts` (`steam`, `play`, `itch`) + push na `main`; Steam também troca `STORE_URL` em `src/core/platform.ts` (§3.3 passo 11); itch registra a URL em PLAN RC4.4.
2. **Patch:** corrija, rode os gates e crie a tag (`release-section`); depois, por loja: Steam §3.6, Google Play §4.7, itch.io §5.3, Poki §6.4. A Steam não exige nova revisão para patches; a Play recusa `versionCode` igual ou menor; a Poki faz uma checagem rápida.
3. **Notas de versão:** o trecho do CHANGELOG vai para *Community → Events & Announcements* (Steam), notas da versão (Play), Devlog (itch).
4. **Monitorar:** *Android vitals* (falhas e ANRs) na Play durante o lançamento gradual; dados do teste de mercado na Poki; wishlists e, depois, a verificação de Steam Deck na Steam.
5. **Manutenção anual:** `targetSdk` mínimo da Play (§4.7 passo 3).
