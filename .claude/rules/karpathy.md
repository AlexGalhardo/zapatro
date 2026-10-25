# Karpathy guidelines (obrigatórias em programação)

Toda tarefa de programação neste repositório (escrever, revisar, refatorar, depurar código, scripts, CI) segue a skill **`karpathy-guidelines`** (`.claude/skills/karpathy-guidelines/`, de [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)) junto com a skill `ponytail`. Carregue a skill no início da tarefa; o resumo abaixo não a substitui.

1. **Pensar antes de codar.** Explicitar suposições; se houver mais de uma leitura do pedido, apresentar as opções em vez de escolher calado; apontar a alternativa mais simples; parar e perguntar quando algo não estiver claro.
2. **Simplicidade primeiro.** O mínimo de código que resolve. Nada de recurso não pedido, abstração de uso único, "flexibilidade" especulativa ou tratamento de erro para cenário impossível. Se 200 linhas cabem em 50, reescreva.
3. **Mudanças cirúrgicas.** Tocar só o necessário; não "melhorar" código, comentários ou formatação vizinhos; seguir o estilo existente. Remover só os órfãos criados pela própria mudança; código morto preexistente é mencionado, não apagado. Teste: cada linha alterada se liga diretamente ao pedido.
4. **Execução guiada por objetivo.** Transformar a tarefa em critério verificável (bug → teste que reproduz e passa; refatoração → testes verdes antes e depois). Em tarefas de vários passos, declarar o plano `passo → verificação` e só concluir com a verificação rodada.

Para tarefas triviais, use o bom senso: as diretrizes favorecem cautela sobre velocidade.
