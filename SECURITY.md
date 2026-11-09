# Política de segurança

## Versões suportadas

Somente a última release no [GitHub Releases](https://github.com/AlexGalhardo/zapatro/releases) e as versões publicadas nas lojas e no site oficial recebem correções de segurança. Releases antigas não são corrigidas.

## Como reportar uma vulnerabilidade

Não abra issue, discussão ou pull request públicos para uma vulnerabilidade.

Reporte em privado pelo formulário [Report a vulnerability](https://github.com/AlexGalhardo/zapatro/security/advisories/new) do GitHub (aviso de segurança privado). Se não puder usar o GitHub, fale com o mantenedor pelo e-mail listado no [perfil dele](https://github.com/AlexGalhardo), com "Segurança" no assunto.

Inclua o que encontrou, onde (arquivo, build, plataforma ou URL), como reproduzir e o impacto esperado. Provas de conceito são bem-vindas; não inclua dados de outras pessoas.

## O que esperar

- Confirmação de recebimento em até 3 dias úteis.
- Avaliação e, se confirmada, plano de correção em até 14 dias, conforme a gravidade.
- Crédito nas notas da release quando a correção sair, a menos que você prefira o anonimato.

## Escopo

Dentro do escopo: este repositório, os builds desktop (Electron) e Android (Capacitor), a demo no navegador, o servidor LAN (`lan/`) e o site estático.

Fora do escopo:

- Edição de save ou de memória na máquina da própria pessoa (jogo local; o save não é uma fronteira de confiança).
- Negação de serviço, testes de carga e varreduras automatizadas intensas do site.
- Engenharia social, phishing e ataques físicos.
- Falhas em serviços de terceiros (Vercel, Steam, Google Play, itch.io, Poki) que não sejam causadas pela configuração do Zapatro.
- Relatos sem impacto de segurança demonstrado.

## Porto seguro

Pesquisa feita de boa-fé, dentro deste escopo, sem acessar ou alterar dados de outras pessoas e sem degradar o serviço, não resultará em ação legal do mantenedor.
