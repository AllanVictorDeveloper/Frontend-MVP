document.addEventListener("DOMContentLoaded", () => {
  const URL_BASE_API = "http://127.0.0.1:5000";

  const corpoTabelaDespesas = document.getElementById("despesas-table-body");
  const selectCategoriaAdicao = document.getElementById("categoria_id");
  const botaoAdicionarDespesa = document.getElementById("add-despesa-btn");

  const formularioAdicionarDespesa =
    document.getElementById("add-despesa-form");
  const botaoCancelarAdicaoDespesa =
    document.getElementById("cancel-add-despesa");
  const inputDataDespesaAdicao = document.getElementById("data_despesa");
  const containerTabelaDespesas = document.querySelector(".table-container");

  const modalDetalhesDespesa = document.getElementById("expense-details-modal");
  const botaoFecharModal = modalDetalhesDespesa.querySelector(".close-button");
  const formularioEditarDespesa = document.getElementById("edit-expense-form");
  const botaoCancelarEdicaoDespesa = document.getElementById(
    "cancel-edit-expense"
  );

  const addExpenseModal = document.getElementById("add-expense-modal");
  const botaoFecharAddModal = document.getElementById("close-add-modal");
  const inputIdDespesaEdicao = document.getElementById("edit-expense-id");
  const inputNomeDespesaEdicao = document.getElementById("edit-expense-name");
  const inputValorDespesaEdicao = document.getElementById("edit-expense-value");
  const inputDataDespesaEdicao = document.getElementById("edit-expense-date");
  const inputDataVencimentoMensalEdicao = document.getElementById(
    "edit-expense-due-date"
  );
  const selectCategoriaEdicao = document.getElementById(
    "edit-expense-category"
  );

  function mostrarToast(mensagem, tipo = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${tipo === "error" ? "error" : ""}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function mostrarCarregamento() {
    corpoTabelaDespesas.innerHTML =
      '<tr><td colspan="8">Carregando despesas...</td></tr>';
  }

  function mostrarErro(mensagem) {
    if (mensagem === "Failed to fetch")
      mensagem =
        "Erro de conexão com o servidor. Verifique se a API está rodando.";
    corpoTabelaDespesas.innerHTML = `<tr><td colspan="8" style="color: red;">${mensagem}</td></tr>`;
    mostrarToast(mensagem, "error");
  }

  botaoAdicionarDespesa.addEventListener("click", () => {
    addExpenseModal.style.display = "flex";
    formularioAdicionarDespesa.reset();
    carregarCategoriasAdicao();
    // containerTabelaDespesas.style.display = "none";
  });

  botaoCancelarAdicaoDespesa.addEventListener("click", () => {
    fecharModalAddDespesa();
  });

  botaoFecharAddModal.addEventListener("click", () => {
    fecharModalAddDespesa();
  });

  window.addEventListener("click", (evento) => {
    if (evento.target === addExpenseModal) {
      fecharModalAddDespesa();
    }
  });

  function fecharModalAddDespesa() {
    addExpenseModal.style.display = "none";
    formularioAdicionarDespesa.reset();
    containerTabelaDespesas.style.display = "block";
  }

  const formatarDataParaInput = (stringData) => {
    if (!stringData) return "";
    try {
      const data = new Date(stringData);
      if (isNaN(data.getTime())) return "";
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const dia = String(data.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}`;
    } catch (e) {
      return "";
    }
  };

  async function carregarCategoriasAdicao() {
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_categorias`);
      if (!resposta.ok) throw new Error("Erro ao carregar categorias.");
      const dados = await resposta.json();
      selectCategoriaAdicao.innerHTML =
        '<option value="">Selecione uma categoria</option>';
        selectCategoriaAdicao.style.cursor = "pointer";
      dados.categorias.forEach((categoria) => {
        const opcao = document.createElement("option");
        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;
        selectCategoriaAdicao.appendChild(opcao);
      });
    } catch (erro) {
      mostrarToast("Erro ao carregar categorias", "error");
    }
  }

  async function popularCategoriasParaModal(categoriaItem) {
    selectCategoriaEdicao.innerHTML = '<option value="">Carregando...</option>';
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_categorias`);
      if (!resposta.ok)
        throw new Error("Erro ao carregar categorias para o modal.");
      const dados = await resposta.json();
      selectCategoriaEdicao.innerHTML =
        '<option value="">Selecione uma categoria</option>';
      selectCategoriaEdicao.style.cursor = "pointer";
      dados.categorias.forEach((categoria) => {
        const opcao = document.createElement("option");
        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;
        if (categoriaItem?.nome === categoria.nome) {
          opcao.selected = true;
        }
        selectCategoriaEdicao.appendChild(opcao);
      });
    } catch (erro) {
      mostrarToast("Erro ao carregar categorias para edição", "error");
    }
  }

  async function buscarEExibirDespesas() {
    mostrarCarregamento();
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_despesas`);
      if (!resposta.ok) throw new Error("Erro ao buscar despesas.");
      const dados = await resposta.json();
      renderizarTabelaDespesas(dados.despesas);
    } catch (erro) {
      mostrarErro(erro.message);
    }
  }

  function renderizarTabelaDespesas(despesas) {
    corpoTabelaDespesas.innerHTML = "";
    if (despesas.length === 0) {
      corpoTabelaDespesas.innerHTML =
        '<tr><td colspan="8">Nenhuma despesa cadastrada.</td></tr>';
      return;
    }
    despesas.forEach((despesa) => {
      const linha = corpoTabelaDespesas.insertRow();
      linha.insertCell(0).textContent = despesa.id;
      linha.insertCell(1).textContent = despesa.nome_despesa;
      linha.insertCell(2).textContent = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(despesa.valor);
      linha.insertCell(3).textContent = despesa.data_despesa
        ? new Date(despesa.data_despesa).toLocaleDateString("pt-BR")
        : "N/A";
      linha.insertCell(4).textContent = despesa.data_vencimento_mensal
        ? new Date(despesa.data_vencimento_mensal).toLocaleDateString("pt-BR")
        : "N/A";
      linha.insertCell(5).textContent = despesa.categoria
        ? despesa.categoria.nome
        : "N/A";
      const celulaAcoes = linha.insertCell(6);
      celulaAcoes.classList.add("table-actions");
      const botaoEditar = document.createElement("button");
      botaoEditar.innerHTML = '<i class="fas fa-edit"></i>';
      botaoEditar.classList.add("btn-edit");
      botaoEditar.title = "Editar Despesa";
      botaoEditar.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirModalEdicao(despesa);
      });
      celulaAcoes.appendChild(botaoEditar);
      const botaoExcluir = document.createElement("button");
      botaoExcluir.innerHTML = '<i class="fas fa-trash"></i>';
      botaoExcluir.classList.add("btn-delete");
      botaoExcluir.title = "Excluir Despesa";
      botaoExcluir.addEventListener("click", (e) => {
        e.stopPropagation();
        excluirDespesa(despesa.id);
      });
      celulaAcoes.appendChild(botaoExcluir);
    });
  }

  async function excluirDespesa(idDespesa) {
    if (!confirm(`Tem certeza que deseja excluir a despesa ID ${idDespesa}?`))
      return;
    try {
      const resposta = await fetch(`${URL_BASE_API}/deletar_despesa`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ despesa_id: idDespesa }),
      });
      if (resposta.status === 204) {
        mostrarToast("Despesa excluída com sucesso!");
        buscarEExibirDespesas();
      } else {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao excluir despesa.");
      }
    } catch (erro) {
      mostrarToast("Erro ao excluir despesa: " + erro.message, "error");
    }
  }

  async function adicionarDespesa(evento) {
    evento.preventDefault();
    const dadosFormulario = new FormData(formularioAdicionarDespesa);
    const dadosDespesa = {};
    for (const [chave, valor] of dadosFormulario.entries()) {
      dadosDespesa[chave] = valor;
    }
    dadosDespesa.valor = parseFloat(dadosDespesa.valor);
    dadosDespesa.categoria_id = parseInt(dadosDespesa.categoria_id);
    dadosDespesa.data_despesa =
      dadosDespesa.data_despesa === "" ? null : dadosDespesa.data_despesa;
    dadosDespesa.data_vencimento_mensal =
      dadosDespesa.data_vencimento_mensal === ""
        ? null
        : dadosDespesa.data_vencimento_mensal;
    try {
      const resposta = await fetch(`${URL_BASE_API}/cadastrar_despesas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosDespesa),
      });
      if (resposta.status === 201) {
        mostrarToast("Despesa adicionada com sucesso!");
        formularioAdicionarDespesa.reset();
        addExpenseModal.style.display = "none";
        containerTabelaDespesas.style.display = "block";
        buscarEExibirDespesas();
      } else {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao adicionar despesa.");
      }
    } catch (erro) {
      mostrarToast("Erro ao adicionar despesa: " + erro.message, "error");
    }
  }

  function definirDataMaximaParaDespesa() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    inputDataDespesaAdicao.setAttribute("max", `${ano}-${mes}-${dia}`);
  }

  async function abrirModalEdicao(despesa) {
    inputIdDespesaEdicao.value = despesa.id;
    inputNomeDespesaEdicao.value = despesa.nome_despesa;
    inputValorDespesaEdicao.value = parseFloat(despesa.valor).toFixed(2);
    inputDataDespesaEdicao.value = formatarDataParaInput(despesa.data_despesa);
    inputDataVencimentoMensalEdicao.value = formatarDataParaInput(
      despesa.data_vencimento_mensal
    );
    await popularCategoriasParaModal(despesa.categoria ?? null);
    modalDetalhesDespesa.style.display = "flex";
  }

  function fecharModalEdicao() {
    modalDetalhesDespesa.style.display = "none";
    formularioEditarDespesa.reset();
  }

  botaoFecharModal.addEventListener("click", fecharModalEdicao);
  botaoCancelarEdicaoDespesa.addEventListener("click", fecharModalEdicao);
  window.addEventListener("click", (evento) => {
    if (evento.target === modalDetalhesDespesa) fecharModalEdicao();
  });

  formularioEditarDespesa.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const dadosDespesaAtualizados = {
      despesa_id: inputIdDespesaEdicao.value,
      nome_despesa: inputNomeDespesaEdicao.value,
      valor: parseFloat(inputValorDespesaEdicao.value),
      data_despesa: inputDataDespesaEdicao.value || null,
      data_vencimento_mensal: inputDataVencimentoMensalEdicao.value || null,
      categoria_id: parseInt(selectCategoriaEdicao.value),
    };
    try {
      const resposta = await fetch(`${URL_BASE_API}/atualizar_despesa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosDespesaAtualizados),
      });
      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao atualizar despesa.");
      }
      await resposta.json();
      buscarEExibirDespesas();
      fecharModalEdicao();
      mostrarToast("Despesa atualizada com sucesso!");
    } catch (erro) {
      mostrarToast(`Erro ao atualizar despesa: ${erro.message}`, "error");
    }
  });

  botaoAdicionarDespesa.addEventListener("click", () => {
    // containerTabelaDespesas.style.display = "none";
    formularioAdicionarDespesa.reset();
    carregarCategoriasAdicao();
  });

  botaoCancelarAdicaoDespesa.addEventListener("click", () => {
    containerFormAdicionarDespesa.style.display = "none";
    containerTabelaDespesas.style.display = "block";
  });

  formularioAdicionarDespesa.addEventListener("submit", adicionarDespesa);

  buscarEExibirDespesas();
  definirDataMaximaParaDespesa();
});
