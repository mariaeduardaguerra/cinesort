const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const arquivo = path.join(__dirname, "filmes.json");

function carregarFilmes() {
  if (!fs.existsSync(arquivo)) {
    return [
      {
        titulo: "Coraline",
        ano: 2009,
        duracao: 100,
        atmosfera: "Sombrio e mágico",
        assistido: true
      },
      {
        titulo: "A Família Addams",
        ano: 1991,
        duracao: 99,
        atmosfera: "Gótico e divertido",
        assistido: false
      }
    ];
  }

  const dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  if (
    !Array.isArray(dados) ||
    !dados.every(filme =>
      filme &&
      typeof filme.titulo === "string" &&
      Number.isInteger(filme.ano) &&
      Number.isInteger(filme.duracao) &&
      filme.duracao > 0 &&
      typeof filme.atmosfera === "string" &&
      typeof filme.assistido === "boolean"
    )
  ) {
    throw new Error("O arquivo filmes.json contém dados inválidos.");
  }

  return dados;
}

let filmes;

function salvarFilmes() {
  fs.writeFileSync(arquivo, JSON.stringify(filmes, null, 2), "utf8");
}

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mostrarFilmes(lista) {
  if (lista.length === 0) {
    console.log("\nNenhum filme encontrado.");
    return;
  }

  for (const [indice, filme] of lista.entries()) {
    console.log(`\n${indice + 1}. ${filme.titulo} (${filme.ano})`);
    console.log(`   Duração: ${filme.duracao} minutos`);
    console.log(`   Atmosfera: ${filme.atmosfera}`);
    console.log(
      `   Status: ${filme.assistido ? "Já assistido" : "Quero assistir"}`
    );
  }

  console.log(`\nTotal: ${lista.length} filme(s).`);
}

async function lerTexto(pergunta) {
  while (true) {
    const resposta = (await terminal.question(pergunta)).trim();

    if (resposta) {
      return resposta;
    }

    console.log("Preencha este campo.");
  }
}

async function lerNumero(pergunta, minimo, maximo) {
  while (true) {
    const texto = (await terminal.question(pergunta)).trim();
    const numero = Number(texto);

    if (
      texto !== "" &&
      Number.isInteger(numero) &&
      numero >= minimo &&
      numero <= maximo
    ) {
      return numero;
    }

    console.log(`Digite um número inteiro entre ${minimo} e ${maximo}.`);
  }
}

async function lerSimNao(pergunta) {
  while (true) {
    const resposta = normalizar(await terminal.question(pergunta));

    if (resposta === "s" || resposta === "sim") return true;
    if (resposta === "n" || resposta === "nao") return false;

    console.log("Digite S para sim ou N para não.");
  }
}

async function cadastrarFilme() {
  const titulo = await lerTexto("\nTítulo: ");
  const ano = await lerNumero("Ano: ", 1888, 2100);

  const duplicado = filmes.some(filme =>
    normalizar(filme.titulo) === normalizar(titulo) &&
    filme.ano === ano
  );

  if (duplicado) {
    console.log("\nEsse filme já está cadastrado.");
    return;
  }

  const duracao = await lerNumero("Duração em minutos: ", 1, 10000);
  const atmosfera = await lerTexto("Atmosfera: ");
  const assistido = await lerSimNao("Já assistiu? (S/N): ");

  filmes.push({ titulo, ano, duracao, atmosfera, assistido });
  salvarFilmes();

  console.log("\nFilme cadastrado!");
}

async function buscarFilme() {
  const busca = normalizar(await lerTexto("\nDigite parte do título: "));
  const encontrados = [];

  // Busca sequencial: verifica cada filme da lista.
  for (const filme of filmes) {
    if (normalizar(filme.titulo).includes(busca)) {
      encontrados.push(filme);
    }
  }

  mostrarFilmes(encontrados);
}

async function filtrarPorTempo() {
  const tempo = await lerNumero("\nTempo disponível em minutos: ", 1, 10000);
  mostrarFilmes(filmes.filter(filme => filme.duracao <= tempo));
}

async function filtrarPorAtmosfera() {
  const atmosfera = normalizar(
    await lerTexto("\nAtmosfera desejada: ")
  );

  mostrarFilmes(
    filmes.filter(filme =>
      normalizar(filme.atmosfera).includes(atmosfera)
    )
  );
}

async function ordenarFilmes() {
  console.log("\n1. Título (A–Z)");
  console.log("2. Duração (menor para maior)");

  const criterio = await lerNumero("Escolha: ", 1, 2);
  const ordenados = [...filmes];

  // Ordenação por inserção: posiciona cada filme no lugar correto.
  for (let i = 1; i < ordenados.length; i++) {
    const atual = ordenados[i];
    let j = i - 1;

    while (
      j >= 0 &&
      (
        criterio === 1
          ? atual.titulo.localeCompare(
              ordenados[j].titulo,
              "pt-BR",
              { sensitivity: "base" }
            ) < 0
          : atual.duracao < ordenados[j].duracao
      )
    ) {
      ordenados[j + 1] = ordenados[j];
      j--;
    }

    ordenados[j + 1] = atual;
  }

  mostrarFilmes(ordenados);
}

async function alterarStatus() {
  if (filmes.length === 0) {
    console.log("\nNão há filmes cadastrados.");
    return;
  }

  mostrarFilmes(filmes);

  const numero = await lerNumero(
    "\nNúmero do filme para alterar o status: ",
    1,
    filmes.length
  );

  const filme = filmes[numero - 1];
  filme.assistido = !filme.assistido;
  salvarFilmes();

  console.log(
    `\n${filme.titulo}: ${filme.assistido ? "Já assistido" : "Quero assistir"}.`
  );
}

async function excluirFilme() {
  if (filmes.length === 0) {
    console.log("\nNão há filmes cadastrados.");
    return;
  }

  mostrarFilmes(filmes);

  const numero = await lerNumero(
    "\nNúmero do filme para excluir: ",
    1,
    filmes.length
  );

  const confirmado = await lerSimNao(
    `Excluir "${filmes[numero - 1].titulo}"? (S/N): `
  );

  if (!confirmado) {
    console.log("\nExclusão cancelada.");
    return;
  }

  filmes.splice(numero - 1, 1);
  salvarFilmes();
  console.log("\nFilme excluído.");
}

async function iniciar() {
  filmes = carregarFilmes();

  console.log("\n🎬 CineSort — organize sua próxima sessão!");

  let continuar = true;

  while (continuar) {
    console.log(`
1. Listar filmes
2. Cadastrar filme
3. Buscar por título
4. Filtrar por tempo disponível
5. Filtrar por atmosfera
6. Ordenar filmes
7. Alterar status de assistido
8. Excluir filme
0. Sair
`);

    const opcao = await lerNumero("Escolha uma opção: ", 0, 8);

    switch (opcao) {
      case 1:
        mostrarFilmes(filmes);
        break;
      case 2:
        await cadastrarFilme();
        break;
      case 3:
        await buscarFilme();
        break;
      case 4:
        await filtrarPorTempo();
        break;
      case 5:
        await filtrarPorAtmosfera();
        break;
      case 6:
        await ordenarFilmes();
        break;
      case 7:
        await alterarStatus();
        break;
      case 8:
        await excluirFilme();
        break;
      case 0:
        continuar = false;
        console.log("\nAté a próxima sessão! 🎬");
        break;
    }
  }
}

iniciar()
  .catch(erro => {
    console.error(`\nNão foi possível continuar: ${erro.message}`);
    process.exitCode = 1;
  })
  .finally(() => terminal.close());