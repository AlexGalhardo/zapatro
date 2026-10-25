Agora que fizemos o docs/game-design-principles.md, vamos fazer o arquivo MAIS IMPORTANTE desse projeto todo: o PLAN.md

- Você percebeu que esse projeto aqui já tem toda uma estrutura de arquivos, pastas e configurações. Isso tudo é de um outro jogo que eu fiz usando todas as ferramentas que vamos usar aqui:
	- Phaser.io v4
	- Pixellab.ai para geração dos assets visuais em PIXEL ART 2D
	- ElevenLabs para criação dos assets de sons/vfx
	- ElectronJS para portar a versão web para desktop (build que irá para a steam)
	- CapacitorJS para portar a versão web para mobile (android/ios)

## CHECKLIST do que esse projeto vai ter na v1.0.0 stable:
- Deploy na web totalmente funcional sem bugs aparentes;
- Build desktop totalmente funcional sem bugs aparentes;
- Build mobile totalmente funcional sem bugs aparentes;
- Um site vendendo o jogo: pode se espelhar no site do https://www.playbalatro.com/
	- Também teremos PressKit oficial
	- Vamos criar um video de 1 minuto de trailer desse jogo para usarmos na divulgação/marketing/anúncios usando -> usando https://www.remotion.dev/;

## ANTES DE COMEÇAR

- Não mecha em nada nos arquivos ainda. Eu quero que você leia todos os arquivos que estão aqui do outro projeto que eu fiz, para você pegar bastante contexto de como vamos trabalhar no desenvolvimento desse jogo:
	- Padrões de projetos, arquivos, pastas, commit, semver, ci/cd, lint, tsc, build, testes, documentações, checklists, asserts, QA, etc

Agora eu só quero que você use a skill de interview-me para me fazer as perguntas finais antes de começar esse desenvolvimento: dúvidas técnicas, detalhes de implementação, dúvidas sobre configurações, do jogo em geral, etc. Sane todas suas dúvidas para criar o PLAN.md
	- Na criação do PLAN.md seja bastante específicos, quebre o desenvolvimento em FASES: ALPHA, BETA, 1.0.0 RELEASE CANDIDATE, checklists, asserts de done, etc.
	- Sempre mantenha o CHANGELOG.md atualiazado com todas as mudanças que vc for ir fazendo;

O jogo deve começar na versão 0.0.1 pré-alpha e ir evoluindo seguindo as boas práticas.
