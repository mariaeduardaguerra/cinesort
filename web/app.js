// A coleção fica salva apenas neste navegador.
const CHAVE_COLECAO = "cinesort-web-v1";

const selecionar = (seletor) => document.querySelector(seletor);

let abaAtual = "all";
let atmosferaAtual = "Todos";
let temporizadorMensagem;

// Filmes de exemplo exibidos no primeiro acesso.
const filmesIniciais = [
  {
    titulo: "Coraline",
    ano: 2009,
    duracao: 100,
    atmosfera: "Mágico",
    symbol: "✧",
    color: "#12313d",
    glow: "#417f8b",
    assistido: true,
    favorito: true
  },
  {
    titulo: "A Família Addams",
    ano: 1991,
    duracao: 99,
    atmosfera: "Gótico",
    symbol: "☾",
    color: "#302536",
    glow: "#65506c",
    assistido: true,
    favorito: true
  },
  {
    titulo: "A Morte lhe Cai Bem",
    ano: 1992,
    duracao: 104,
    atmosfera: "Camp",
    symbol: "♜",
    color: "#214237",
    glow: "#518c68",
    assistido: false,
    favorito: false
  },
  {
    titulo: "Da Magia à Sedução",
    ano: 1998,
    duracao: 104,
    atmosfera: "Mágico",
    symbol: "✦",
    color: "#49282c",
    glow: "#986b4b",
    assistido: false,
    favorito: false
  },
  {
    titulo: "Os Fantasmas se Divertem",
    ano: 1988,
    duracao: 92,
    atmosfera: "Camp",
    symbol: "♟",
    color: "#323e32",
    glow: "#758357",
    assistido: true,
    favorito: false
  },
  {
    titulo: "As Bruxas",
    ano: 1990,
    duracao: 91,
    atmosfera: "Gótico",
    symbol: "♠",
    color: "#302b4c",
    glow: "#765a9c",
    assistido: false,
    favorito: false
  },
  {
    titulo: "The Love Witch",
    ano: 2016,
    duracao: 120,
    atmosfera: "Drama",
    symbol: "♥",
    color: "#58232f",
    glow: "#af666b",
    assistido: false,
    favorito: false
  },
  {
    titulo: "O Estranho Mundo de Jack",
    ano: 1993,
    duracao: 76,
    atmosfera: "Aconchegante",
    symbol: "☽",
    color: "#252c49",
    glow: "#535e92",
    assistido: false,
    favorito: false
  }
];

let filmes = carregarColecao();

// Funções auxiliares
function criarId() {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escaparHtml(texto) {
  const caracteres = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => caracteres[caractere]
  );
}

function validarFilme(filme) {
  return (
    filme &&
    typeof filme.titulo === "string" &&
    filme.titulo.trim().length > 0 &&
    filme.titulo.length <= 100 &&
    Number.isInteger(filme.ano) &&
    filme.ano >= 1888 &&
    filme.ano <= 2100 &&
    Number.isInteger(filme.duracao) &&
    filme.duracao >= 1 &&
    filme.duracao <= 10000 &&
    typeof filme.atmosfera === "string" &&
    typeof filme.assistido === "boolean"
  );
}

function prepararFilme(filme) {
  return {
    ...filme,
    id: criarId(),
    favorito: Boolean(filme.favorito)
  };
}

function mostrarMensagem(texto) {
  const mensagem = selecionar("#toast");

  mensagem.textContent = texto;
  mensagem.style.display = "block";

  clearTimeout(temporizadorMensagem);

  temporizadorMensagem = setTimeout(() => {
    mensagem.style.display = "none";
  }, 3200);
}

// Armazenamento da coleção
function carregarColecao() {
  try {
    const dadosSalvos = localStorage.getItem(CHAVE_COLECAO);

    if (dadosSalvos !== null) {
      const dados = JSON.parse(dadosSalvos);

      if (!Array.isArray(dados) || !dados.every(validarFilme)) {
        throw new Error("Coleção inválida.");
      }

      return dados.map(prepararFilme);
    }
  } catch {
    alert(
      "Não foi possível carregar os dados salvos. " +
      "Uma coleção de exemplo será exibida."
    );
  }

  return filmesIniciais.map(prepararFilme);
}

function salvarColecao() {
  try {
    localStorage.setItem(CHAVE_COLECAO, JSON.stringify(filmes));
  } catch {
    mostrarMensagem(
      "Não foi possível salvar no navegador. " +
      "Exporte a coleção para guardar suas alterações."
    );
  }

  renderizarPagina();
}

// Busca, filtros e ordenação
function obterFilmesFiltrados() {
  const busca = normalizarTexto(selecionar("#search").value);
  const tempoDisponivel = Number(selecionar("#time").value);
  const ordenacao = selecionar("#sort").value;

  const resultado = filmes.filter((filme) => {
    const correspondeAba =
      abaAtual === "all" ||
      (abaAtual === "watch" && !filme.assistido) ||
      (abaAtual === "favorites" && filme.favorito);

    const correspondeAtmosfera =
      atmosferaAtual === "Todos" ||
      filme.atmosfera === atmosferaAtual;

    const correspondeBusca =
      normalizarTexto(filme.titulo).includes(busca);

    const correspondeTempo =
      tempoDisponivel === 0 ||
      filme.duracao <= tempoDisponivel;

    return (
      correspondeAba &&
      correspondeAtmosfera &&
      correspondeBusca &&
      correspondeTempo
    );
  });

  switch (ordenacao) {
    case "title":
      resultado.sort((primeiro, segundo) => {
        return primeiro.titulo.localeCompare(
          segundo.titulo,
          "pt-BR",
          { sensitivity: "base" }
        );
      });
      break;

    case "duration":
      resultado.sort((primeiro, segundo) => {
        return primeiro.duracao - segundo.duracao;
      });
      break;

    case "year":
      resultado.sort((primeiro, segundo) => {
        return primeiro.ano - segundo.ano;
      });
      break;

    default:
      resultado.reverse();
  }

  return resultado;
}

// Elementos exibidos na página
function renderizarIndicadores() {
  const assistidos = filmes.filter((filme) => filme.assistido);
  const favoritos = filmes.filter((filme) => filme.favorito);

  const minutosAssistidos = assistidos.reduce((total, filme) => {
    return total + filme.duracao;
  }, 0);

  const indicadores = [
    {
      valor: filmes.length,
      descricao: "Filmes na coleção"
    },
    {
      valor: filmes.length - assistidos.length,
      descricao: "Histórias para descobrir"
    },
    {
      valor: favoritos.length,
      descricao: "Filmes favoritos"
    },
    {
      valor: `${Math.round(minutosAssistidos / 60)}h`,
      descricao: "De histórias assistidas"
    }
  ];

  selecionar("#stats").innerHTML = indicadores
    .map((indicador) => {
      return `
        <div class="stat">
          <strong>${indicador.valor}</strong>
          <span>${indicador.descricao}</span>
        </div>
      `;
    })
    .join("");
}

function renderizarAtmosferas() {
  const atmosferas = [
    "Todos",
    ...new Set(filmes.map((filme) => filme.atmosfera))
  ];

  if (!atmosferas.includes(atmosferaAtual)) {
    atmosferaAtual = "Todos";
  }

  selecionar("#chips").innerHTML = atmosferas
    .map((atmosfera) => {
      const classeAtiva =
        atmosfera === atmosferaAtual ? "active" : "";

      return `
        <button
          class="chip ${classeAtiva}"
          data-mood="${escaparHtml(atmosfera)}"
        >
          ${escaparHtml(atmosfera)}
        </button>
      `;
    })
    .join("");
}

function criarCartaoFilme(filme) {
  const formatoCor = /^#[0-9a-f]{6}$/i;

  const cor = formatoCor.test(filme.color)
    ? filme.color
    : "#452530";

  const brilho = formatoCor.test(filme.glow)
    ? filme.glow
    : "#875365";

  const status = filme.assistido
    ? "✓ JÁ ASSISTIDO"
    : "◷ QUERO ASSISTIR";

  const acaoFavorito = filme.favorito
    ? "Remover dos favoritos"
    : "Adicionar aos favoritos";

  return `
    <article class="card">
      <div
        class="poster"
        style="--color: ${cor}; --glow: ${brilho};"
      >
        <small>CineSort · coleção pessoal</small>

        <div class="symbol" aria-hidden="true">
          ${escaparHtml(filme.symbol || "✦")}
        </div>

        <div class="art-title">
          ${escaparHtml(filme.titulo)}
        </div>

        <span class="status">${status}</span>

        <button
          class="fav"
          data-fav="${escaparHtml(filme.id)}"
          aria-label="${acaoFavorito}"
          aria-pressed="${Boolean(filme.favorito)}"
        >
          ${filme.favorito ? "♥" : "♡"}
        </button>
      </div>

      <h3>${escaparHtml(filme.titulo)}</h3>

      <div class="meta">
        ${filme.ano} · ${filme.duracao} min
      </div>

      <div class="card-bottom">
        <span class="mood">
          ${escaparHtml(filme.atmosfera)}
        </span>

        <button
          class="details"
          data-detail="${escaparHtml(filme.id)}"
        >
          Ver detalhes ↗
        </button>
      </div>
    </article>
  `;
}

function renderizarPagina() {
  renderizarIndicadores();
  renderizarAtmosferas();

  const resultado = obterFilmesFiltrados();

  const titulos = {
    all: "Sua coleção, seu cinema",
    watch: "Sua próxima sessão",
    favorites: "Histórias que ficam"
  };

  selecionar("#sectionHeading").textContent = titulos[abaAtual];

  selecionar("#count").textContent =
    `${resultado.length} filme(s) · uma história de cada vez`;

  if (resultado.length === 0) {
    selecionar("#grid").innerHTML = `
      <div class="empty">
        Nenhuma história por aqui.
        <br><br>
        Altere os filtros ou adicione um filme à coleção.
      </div>
    `;

    return;
  }

  selecionar("#grid").innerHTML = resultado
    .map(criarCartaoFilme)
    .join("");
}

// Cadastro e edição
function abrirFormulario(filme = null) {
  selecionar("#form").reset();
  selecionar("#editId").value = filme ? filme.id : "";

  selecionar("#formHeading").textContent = filme
    ? "Editar filme"
    : "Uma nova história";

  if (filme) {
    selecionar("#title").value = filme.titulo;
    selecionar("#year").value = filme.ano;
    selecionar("#duration").value = filme.duracao;
    selecionar("#watched").checked = filme.assistido;

    const campoAtmosfera = selecionar("#mood");

    const atmosferaExiste = [...campoAtmosfera.options].some(
      (opcao) => opcao.value === filme.atmosfera
    );

    // Preserva atmosferas personalizadas importadas do terminal.
    if (!atmosferaExiste) {
      campoAtmosfera.add(
        new Option(filme.atmosfera, filme.atmosfera)
      );
    }

    campoAtmosfera.value = filme.atmosfera;
  } else {
    selecionar("#year").value = new Date().getFullYear();
  }

  selecionar("#editor").showModal();
}

function salvarFormulario(evento) {
  evento.preventDefault();

  const id = selecionar("#editId").value;

  const dados = {
    titulo: selecionar("#title").value.trim(),
    ano: Number(selecionar("#year").value),
    duracao: Number(selecionar("#duration").value),
    atmosfera: selecionar("#mood").value,
    assistido: selecionar("#watched").checked
  };

  if (!validarFilme(dados)) {
    mostrarMensagem("Verifique os dados do filme.");
    return;
  }

  const duplicado = filmes.some((filme) => {
    return (
      filme.id !== id &&
      normalizarTexto(filme.titulo) ===
        normalizarTexto(dados.titulo) &&
      filme.ano === dados.ano
    );
  });

  if (duplicado) {
    mostrarMensagem("Esse filme já está na coleção.");
    return;
  }

  if (id) {
    const filme = filmes.find((item) => item.id === id);

    if (!filme) {
      mostrarMensagem("Filme não encontrado.");
      return;
    }

    Object.assign(filme, dados);
  } else {
    filmes.push({
      ...dados,
      id: criarId(),
      favorito: false
    });
  }

  salvarColecao();
  selecionar("#editor").close();
}

// Detalhes e ações do filme
function abrirDetalhes(id) {
  const filme = filmes.find((item) => item.id === id);

  if (!filme) {
    return;
  }

  selecionar("#detailContent").innerHTML = `
    <span class="eyebrow">Sua sessão particular</span>

    <h2>${escaparHtml(filme.titulo)}</h2>

    <p>
      ${filme.ano} · ${filme.duracao} minutos ·
      ${escaparHtml(filme.atmosfera)}
    </p>

    <p>
      ${
        filme.assistido
          ? "✓ Já assistido"
          : "◷ Na sua lista para assistir"
      }
    </p>

    <div class="actions">
      <button class="outline" id="toggleWatch">
        ${
          filme.assistido
            ? "Marcar como não assistido"
            : "Marcar como assistido"
        }
      </button>

      <button class="primary" id="editFilm">
        Editar
      </button>

      <button class="danger" id="deleteFilm">
        Excluir
      </button>
    </div>
  `;

  selecionar("#toggleWatch").onclick = () => {
    filme.assistido = !filme.assistido;

    salvarColecao();
    selecionar("#detail").close();
  };

  selecionar("#editFilm").onclick = () => {
    selecionar("#detail").close();
    abrirFormulario(filme);
  };

  selecionar("#deleteFilm").onclick = () => {
    const confirmado = confirm(
      `Excluir “${filme.titulo}” da coleção?`
    );

    if (!confirmado) {
      return;
    }

    filmes = filmes.filter((item) => item.id !== id);

    salvarColecao();
    selecionar("#detail").close();

    mostrarMensagem("Filme excluído.");
  };

  selecionar("#detail").showModal();
}

function sugerirFilme() {
  const opcoes = obterFilmesFiltrados().filter((filme) => {
    return !filme.assistido;
  });

  if (opcoes.length === 0) {
    mostrarMensagem(
      "Nenhum filme não assistido atende aos filtros atuais."
    );

    return;
  }

  const indice = Math.floor(Math.random() * opcoes.length);

  abrirDetalhes(opcoes[indice].id);
}

// Importação e exportação
function exportarColecao() {
  const conteudo = JSON.stringify(filmes, null, 2);

  const arquivo = new Blob([conteudo], {
    type: "application/json"
  });

  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = endereco;
  link.download = "cinesort-colecao.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(endereco);
  }, 1000);
}

async function importarColecao(evento) {
  const arquivo = evento.target.files[0];

  if (!arquivo) {
    return;
  }

  try {
    const conteudo = await arquivo.text();
    const dados = JSON.parse(conteudo);

    if (
      !Array.isArray(dados) ||
      dados.length > 5000 ||
      !dados.every(validarFilme)
    ) {
      throw new Error("Arquivo inválido.");
    }

    const confirmado = confirm(
      `Substituir a coleção atual pelos ${dados.length} filmes ` +
      "do arquivo? Exporte a coleção atual antes se quiser preservá-la."
    );

    if (!confirmado) {
      return;
    }

    filmes = dados.map(prepararFilme);

    salvarColecao();
  } catch {
    mostrarMensagem(
      "Arquivo inválido. Use um JSON exportado pelo CineSort."
    );
  } finally {
    evento.target.value = "";
  }
}

// Eventos dos botões e campos
selecionar("#add").onclick = () => abrirFormulario();

selecionar("#cancel").onclick = () => {
  selecionar("#editor").close();
};

selecionar("#closeDetail").onclick = () => {
  selecionar("#detail").close();
};

selecionar("#form").onsubmit = salvarFormulario;

document.querySelectorAll("[data-tab]").forEach((botao) => {
  botao.onclick = () => {
    abaAtual = botao.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach((item) => {
      item.classList.toggle("active", item === botao);
    });

    renderizarPagina();
  };
});

selecionar("#chips").onclick = (evento) => {
  const botao = evento.target.closest("[data-mood]");

  if (!botao) {
    return;
  }

  atmosferaAtual = botao.dataset.mood;

  renderizarPagina();
};

selecionar("#grid").onclick = (evento) => {
  const botaoFavorito = evento.target.closest("[data-fav]");
  const botaoDetalhes = evento.target.closest("[data-detail]");

  if (botaoFavorito) {
    const filme = filmes.find((item) => {
      return item.id === botaoFavorito.dataset.fav;
    });

    if (filme) {
      filme.favorito = !filme.favorito;
      salvarColecao();
    }
  }

  if (botaoDetalhes) {
    abrirDetalhes(botaoDetalhes.dataset.detail);
  }
};

selecionar("#search").addEventListener(
  "input",
  renderizarPagina
);

selecionar("#time").addEventListener(
  "change",
  renderizarPagina
);

selecionar("#sort").addEventListener(
  "change",
  renderizarPagina
);

selecionar("#surprise").onclick = sugerirFilme;

selecionar("#export").onclick = exportarColecao;

selecionar("#import").onclick = () => {
  selecionar("#file").click();
};

selecionar("#file").onchange = importarColecao;

// Primeira exibição da página
renderizarPagina();