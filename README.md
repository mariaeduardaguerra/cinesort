# 🎬 CineSort

Aplicação de terminal para organizar uma coleção de filmes e encontrar
opções para o tempo disponível.

Projeto desenvolvido para praticar lógica de programação e algoritmos
com JavaScript e Node.js.

## Funcionalidades

- Cadastro de filmes com validação dos dados.
- Listagem da coleção.
- Busca por título, ignorando acentos e diferenças entre maiúsculas e minúsculas.
- Filtros por duração e atmosfera.
- Ordenação por título ou duração.
- Alteração do status de assistido.
- Exclusão com confirmação.
- Salvamento local em arquivo JSON.

## Tecnologias

- JavaScript
- Node.js
- Git

Não utiliza dependências externas.

## Como executar

Com o Node.js instalado, execute na pasta do projeto:

```bash
node index.js
```

Escolha uma opção no menu e siga as instruções do terminal.

As alterações são salvas automaticamente no arquivo `filmes.json`.

## Conceitos aplicados

- Variáveis, objetos e arrays.
- Funções e parâmetros.
- Estruturas condicionais e de repetição.
- Entrada e saída pelo terminal.
- Leitura e escrita de arquivos.
- Validação de dados e tratamento de erros.

## Algoritmos

### Busca sequencial

Percorre a coleção verificando quais títulos contêm o texto pesquisado.
Considerando a quantidade de filmes, realiza uma passagem pela lista: O(n).

### Ordenação por inserção

Organiza uma cópia da coleção, posicionando cada filme na posição adequada.
Possui complexidade O(n²) no pior caso.

## Limitações

- Interface disponível apenas no terminal.
- Dados armazenados localmente, sem sincronização entre dispositivos.
- Não permite editar os dados de um filme, exceto o status de assistido.

