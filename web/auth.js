// Integração de contas e coleções com o Supabase.
(() => {
  const buscar = (seletor) => document.querySelector(seletor);

  if (!window.supabase) {
    alert(
      "Não foi possível carregar o serviço de login. " +
      "Confira sua conexão e atualize a página."
    );

    return;
  }

  const cliente = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      global: {
        // Evita que uma requisição fique aguardando indefinidamente.
        fetch: (endereco, opcoes = {}) => {
          return fetch(endereco, {
            ...opcoes,
            signal: AbortSignal.timeout(20000)
          });
        }
      }
    }
  );

  let usuarioAtual = null;
  let usuarioCarregado;
  let colecaoPronta = false;
  let ultimaColecao = [];
  let versaoCarregamento = 0;
  let modoFormulario = "login";

  const salvarLocalmente = salvarColecao;
  const renderizarOriginal = renderizarPagina;

  criarInterface();

  // Atualiza também a indicação de onde os dados estão salvos.
  renderizarPagina = function () {
    renderizarOriginal();

    const aviso = buscar("footer > span:last-child");

    if (aviso) {
      aviso.textContent = usuarioAtual
        ? "Coleção da sua conta."
        : "Dados salvos neste navegador.";
    }
  };

  // Substitui o salvamento local apenas quando há uma conta conectada.
  salvarColecao = async function () {
    if (!usuarioAtual) {
      salvarLocalmente();
      return;
    }

    if (!colecaoPronta) {
      filmes = structuredClone(ultimaColecao);
      renderizarPagina();

      mostrarMensagem("Aguarde o carregamento da coleção.");
      return;
    }

    const usuarioId = usuarioAtual.id;
    const copia = structuredClone(filmes);

    bloquearTela(true, "Salvando sua coleção...");

    try {
      const { error } = await cliente
        .from("colecoes")
        .upsert(
          {
            usuario_id: usuarioId,
            filmes: copia,
            atualizado_em: new Date().toISOString()
          },
          {
            onConflict: "usuario_id"
          }
        );

      if (error) {
        throw error;
      }

      ultimaColecao = copia;

      renderizarPagina();
      mostrarMensagem("Coleção salva na sua conta.");
    } catch (erro) {
      // Volta ao último estado confirmado pelo banco.
      filmes = structuredClone(ultimaColecao);

      renderizarPagina();

      mostrarMensagem(
        "Não foi possível salvar. A alteração foi desfeita. " +
        "Confira sua conexão e tente novamente."
      );

      console.error("Erro ao salvar a coleção:", erro);
    } finally {
      bloquearTela(false);
    }
  };

  function criarInterface() {
    const barra = document.createElement("section");

    barra.className = "account-bar";
    barra.id = "accountBar";
    barra.setAttribute("aria-label", "Sua conta");

    document.querySelector("header").after(barra);

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <dialog id="authDialog">
          <form id="authForm">
            <h2 id="authHeading">Entrar no CineSort</h2>

            <p class="auth-description" id="authDescription">
              Entre para acessar seus filmes em outros dispositivos.
            </p>

            <div id="authEmailGroup">
              <label for="authEmail">E-mail</label>

              <input
                id="authEmail"
                type="email"
                autocomplete="email"
                required
              >
            </div>

            <div id="authPasswordGroup">
              <label for="authPassword">Senha</label>

              <input
                id="authPassword"
                type="password"
                autocomplete="current-password"
                minlength="8"
                required
              >
            </div>

            <p
              class="auth-feedback"
              id="authFeedback"
              role="status"
            ></p>

            <div class="auth-buttons">
              <button
                class="primary"
                id="authSubmit"
                type="submit"
              >
                Entrar
              </button>

              <button
                class="outline"
                id="googleLogin"
                type="button"
              >
                Continuar com Google
              </button>
            </div>

            <div class="auth-links">
              <button type="button" id="changeAuthMode">
                Criar uma conta
              </button>

              <button type="button" id="forgotPassword">
                Esqueci minha senha
              </button>
            </div>

            <div class="auth-separator">
              Sua coleção de visitante fica separada da sua conta.
            </div>

            <button
              type="button"
              class="outline"
              id="closeAuth"
            >
              Fechar
            </button>
          </form>
        </dialog>

        <div
          class="sync-overlay"
          id="syncOverlay"
          role="status"
          hidden
        >
          <p id="syncMessage">Carregando...</p>
        </div>
      `
    );

    buscar("#authForm").onsubmit = enviarFormulario;

    buscar("#changeAuthMode").onclick = () => {
      abrirLogin(
        modoFormulario === "login" ? "cadastro" : "login"
      );
    };

    buscar("#forgotPassword").onclick = () => {
      abrirLogin("recuperar");
    };

    buscar("#closeAuth").onclick = () => {
      buscar("#authDialog").close();
    };

    buscar("#googleLogin").onclick = entrarComGoogle;
  }

  function bloquearTela(bloquear, mensagem = "Carregando...") {
    buscar("#syncOverlay").hidden = !bloquear;
    buscar("#syncMessage").textContent = mensagem;

    const seletores = [
      "header",
      "main",
      "#editor",
      "#detail"
    ];

    seletores.forEach((seletor) => {
      const elemento = buscar(seletor);

      if (elemento) {
        elemento.inert = bloquear || !colecaoPronta;
      }
    });

    buscar("#accountBar").inert = bloquear;
  }

  function atualizarBarra() {
    const barra = buscar("#accountBar");

    barra.replaceChildren();

    const informacoes = document.createElement("div");
    informacoes.className = "account-info";

    const titulo = document.createElement("strong");
    titulo.textContent = usuarioAtual
      ? usuarioAtual.email || "Conta conectada"
      : "Você está no modo visitante";

    const descricao = document.createElement("small");

    if (!colecaoPronta) {
      descricao.textContent =
        "Não foi possível carregar a coleção. Tente novamente.";
    } else {
      descricao.textContent = usuarioAtual
        ? "Seus filmes são salvos online."
        : "Entre para salvar seus filmes na sua conta.";
    }

    informacoes.append(titulo, descricao);

    const acoes = document.createElement("div");
    acoes.className = "account-actions";

    function adicionarBotao(texto, classe, acao) {
      const botao = document.createElement("button");

      botao.textContent = texto;
      botao.className = classe;
      botao.onclick = acao;

      acoes.appendChild(botao);
    }

    if (!colecaoPronta) {
      adicionarBotao("Tentar novamente", "outline", () => {
        usuarioCarregado = undefined;
        atualizarSessao();
      });
    }

    if (usuarioAtual) {
      if (colecaoPronta) {
        adicionarBotao(
          "Copiar coleção deste navegador",
          "outline",
          copiarColecaoVisitante
        );

        adicionarBotao("Atualizar coleção", "outline", () => {
          usuarioCarregado = undefined;
          atualizarSessao();
        });
      }

      adicionarBotao("Sair", "outline", sair);
    } else {
      adicionarBotao("Entrar", "primary", () => {
        abrirLogin("login");
      });
    }

    barra.append(informacoes, acoes);
  }

  function abrirLogin(modo = "login") {
    modoFormulario = modo;

    const formulario = buscar("#authForm");
    formulario.reset();

    buscar("#authFeedback").textContent = "";

    const recuperando = modo === "recuperar";
    const novaSenha = modo === "novaSenha";
    const cadastro = modo === "cadastro";

    buscar("#authHeading").textContent = novaSenha
      ? "Definir nova senha"
      : recuperando
        ? "Recuperar senha"
        : cadastro
          ? "Criar conta"
          : "Entrar no CineSort";

    buscar("#authDescription").textContent = novaSenha
      ? "Escolha uma senha com pelo menos oito caracteres."
      : recuperando
        ? "Enviaremos um link para você redefinir sua senha."
        : "Acesse sua coleção em outros dispositivos.";

    buscar("#authSubmit").textContent = novaSenha
      ? "Salvar nova senha"
      : recuperando
        ? "Enviar link"
        : cadastro
          ? "Criar conta"
          : "Entrar";

    buscar("#authEmailGroup").hidden = novaSenha;
    buscar("#authEmail").disabled = novaSenha;

    buscar("#authPasswordGroup").hidden = recuperando;
    buscar("#authPassword").disabled = recuperando;

    buscar("#authPassword").autocomplete =
      cadastro || novaSenha
        ? "new-password"
        : "current-password";

    buscar("#googleLogin").hidden = recuperando || novaSenha;
    buscar("#changeAuthMode").hidden = novaSenha;
    buscar("#forgotPassword").hidden =
      recuperando || novaSenha;

    buscar("#changeAuthMode").textContent =
      modo === "login"
        ? "Criar uma conta"
        : "Já tenho uma conta";

    const janela = buscar("#authDialog");

    if (!janela.open) {
      janela.showModal();
    }
  }

  function mensagemErro(erro) {
    const mensagem = erro.message || "";

    if (mensagem.includes("Invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (mensagem.includes("Email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }

    if (
      mensagem.includes("rate limit") ||
      erro.status === 429
    ) {
      return "Muitas tentativas. Aguarde antes de tentar novamente.";
    }

    if (
      mensagem.includes("Failed to fetch") ||
      erro.name === "TimeoutError"
    ) {
      return "Não foi possível conectar. Confira sua internet.";
    }

    return mensagem || "Não foi possível concluir a operação.";
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();

    const email = buscar("#authEmail").value.trim();
    const senha = buscar("#authPassword").value;

    const botao = buscar("#authSubmit");
    const feedback = buscar("#authFeedback");

    botao.disabled = true;
    feedback.textContent = "Aguarde...";

    try {
      if (modoFormulario === "recuperar") {
        const { error } =
          await cliente.auth.resetPasswordForEmail(email, {
            redirectTo: URL_DO_SITE
          });

        if (error) throw error;

        feedback.textContent =
          "Se o endereço puder receber a recuperação, " +
          "você receberá um link por e-mail.";

        return;
      }

      if (modoFormulario === "novaSenha") {
        const { error } = await cliente.auth.updateUser({
          password: senha
        });

        if (error) throw error;

        feedback.textContent = "Senha atualizada.";
        return;
      }

      if (modoFormulario === "cadastro") {
        const { data, error } = await cliente.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: URL_DO_SITE
          }
        });

        if (error) throw error;

        if (!data.session) {
          feedback.textContent =
            "Confira seu e-mail para confirmar o cadastro. " +
            "Se já tiver uma conta, tente entrar ou recuperar a senha.";

          return;
        }
      } else {
        const { error } =
          await cliente.auth.signInWithPassword({
            email,
            password: senha
          });

        if (error) throw error;
      }

      buscar("#authDialog").close();
    } catch (erro) {
      feedback.textContent = mensagemErro(erro);
    } finally {
      botao.disabled = false;
    }
  }

  async function entrarComGoogle() {
    const botao = buscar("#googleLogin");
    botao.disabled = true;

    buscar("#authFeedback").textContent =
      "Abrindo o Google...";

    try {
      const { error } = await cliente.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: URL_DO_SITE
        }
      });

      if (error) throw error;
    } catch (erro) {
      buscar("#authFeedback").textContent =
        mensagemErro(erro);
    } finally {
      botao.disabled = false;
    }
  }

  async function sair() {
    bloquearTela(true, "Saindo da sua conta...");

    try {
      const { error } = await cliente.auth.signOut({
        scope: "local"
      });

      if (error) throw error;

      await aplicarSessao(null);
    } catch (erro) {
      mostrarMensagem(mensagemErro(erro));
    } finally {
      bloquearTela(false);
    }
  }

  async function copiarColecaoVisitante() {
    try {
      const texto = localStorage.getItem(CHAVE_COLECAO);

      if (!texto) {
        mostrarMensagem(
          "Não há uma coleção de visitante salva neste navegador."
        );

        return;
      }

      const dados = JSON.parse(texto);

      if (
        !Array.isArray(dados) ||
        !dados.every(validarFilme)
      ) {
        throw new Error("A coleção local está inválida.");
      }

      const confirmado = confirm(
        "Substituir a coleção da conta pela coleção " +
        "salva neste navegador? Exporte a coleção da conta " +
        "antes se quiser preservá-la."
      );

      if (!confirmado) return;

      filmes = dados.map(prepararFilme);
      await salvarColecao();
    } catch (erro) {
      mostrarMensagem(mensagemErro(erro));
    }
  }

  async function aplicarSessao(sessao) {
    const novoUsuario = sessao?.user || null;
    const novoId = novoUsuario?.id || null;

    // Eventos de renovação do token não recarregam a coleção.
    if (usuarioCarregado === novoId) {
      usuarioAtual = novoUsuario;
      return;
    }

    const minhaVersao = ++versaoCarregamento;

    usuarioAtual = novoUsuario;
    colecaoPronta = false;

    // Remove da tela a coleção da sessão anterior.
    filmes = [];
    renderizarPagina();

    bloquearTela(true, "Carregando sua coleção...");

    try {
      let colecao;

      if (novoUsuario) {
        const { data, error } = await cliente
          .from("colecoes")
          .select("filmes")
          .eq("usuario_id", novoUsuario.id)
          .maybeSingle();

        if (error) throw error;

        colecao = data?.filmes || [];

        if (
          !Array.isArray(colecao) ||
          !colecao.every(validarFilme)
        ) {
          throw new Error(
            "Os dados da coleção online estão inválidos."
          );
        }

        colecao = colecao.map(prepararFilme);
      } else {
        colecao = carregarColecao();
      }

      if (minhaVersao !== versaoCarregamento) return;

      filmes = colecao;
      ultimaColecao = structuredClone(colecao);

      usuarioCarregado = novoId;
      colecaoPronta = true;

      renderizarPagina();
    } catch (erro) {
      if (minhaVersao !== versaoCarregamento) return;

      usuarioCarregado = undefined;

      mostrarMensagem(
        "Não foi possível carregar sua coleção. " +
        "Use Tentar novamente ou saia da conta."
      );

      console.error("Erro ao carregar a coleção:", erro);
    } finally {
      if (minhaVersao === versaoCarregamento) {
        bloquearTela(false);
        atualizarBarra();
      }
    }
  }

  async function atualizarSessao() {
    bloquearTela(true, "Verificando sua conta...");

    try {
      const { data, error } = await cliente.auth.getSession();

      if (error) throw error;

      await aplicarSessao(data.session);
    } catch (erro) {
      colecaoPronta = false;

      bloquearTela(false);
      atualizarBarra();

      mostrarMensagem(mensagemErro(erro));
    }
  }

  // O carregamento ocorre fora do callback de autenticação.
  cliente.auth.onAuthStateChange((evento, sessao) => {
    setTimeout(() => {
      aplicarSessao(sessao).then(() => {
        if (evento === "PASSWORD_RECOVERY") {
          abrirLogin("novaSenha");
        }
      });
    }, 0);
  });

  atualizarSessao();
})();