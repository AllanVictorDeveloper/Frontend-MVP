document.addEventListener("DOMContentLoaded", () => {
  const URL_BASE_API = "http://127.0.0.1:5000";

  // --- Elementos do DOM ---
  const corpoTabelaDespesas = document.getElementById("despesas-table-body");
  const botaoAdicionarDespesa = document.getElementById("add-despesa-btn");

  // Modal Principal (Adicionar/Editar)
  const expenseModal = document.getElementById("expense-modal");
  const modalTitle = document.getElementById("modal-title");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const expenseForm = document.getElementById("expense-form");

  // Campos do Formulário
  const expenseIdInput = document.getElementById("expense-id");
  const nomeDespesaInput = document.getElementById("nome_despesa");
  const valorInput = document.getElementById("valor");
  const categoriaSelect = document.getElementById("categoria_id");
  const dataDespesaInput = document.getElementById("data_despesa");
  const dataVencimentoInput = document.getElementById("data_vencimento_mensal");

  // Modal de Confirmação
  const confirmModal = document.getElementById("confirm-modal");
  const confirmModalText = document.getElementById("confirm-modal-text");
  const confirmOkBtn = document.getElementById("confirm-ok-btn");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  let onConfirmCallback = null;

  // --- Funções Auxiliares ---

  function mostrarToast(mensagem, tipo = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${tipo === "error" ? "error" : ""}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function mostrarCarregamento() {
    corpoTabelaDespesas.innerHTML = `<tr><td colspan="7" style="text-align:center;">Carregando despesas...</td></tr>`;
  }

  function mostrarErro(mensagem) {
    if (mensagem.includes("Failed to fetch")) {
      mensagem =
        "Erro de conexão com o servidor. Verifique se a API está rodando.";
    }
    corpoTabelaDespesas.innerHTML = `<tr><td colspan="7" style="color: red; text-align:center;">${mensagem}</td></tr>`;
    mostrarToast(mensagem, "error");
  }

  const formatarDataParaInput = (stringData) => {
    if (!stringData) return "";
    const data = new Date(stringData);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  async function carregarCategorias(selectElement, categoriaItem = null) {
    selectElement.innerHTML = '<option value="">Carregando...</option>';
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_categorias`);
      if (!resposta.ok) throw new Error("Erro ao carregar categorias.");
      const dados = await resposta.json();
      selectElement.innerHTML =
        '<option value="">Selecione uma categoria</option>';
      selectElement.style.cursor = "pointer";

      dados.categorias.forEach((categoria) => {
        const opcao = document.createElement("option");
        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;
        // Se for edição, marca a categoria selecionada
        if (categoria.nome === categoriaItem) {
          opcao.selected = true;
        }
        selectElement.appendChild(opcao);
      });
    } catch (erro) {
      mostrarToast(erro.message, "error");
      selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }


  async function buscarEExibirDespesas() {
    mostrarCarregamento();
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_despesas`);
      if (!resposta.ok) {
        const erroData = await resposta.json().catch(() => ({
          message: "Erro desconhecido ao buscar despesas.",
        }));
        throw new Error(erroData.message);
      }
      const dados = await resposta.json();
      renderizarTabelaDespesas(dados.despesas);
    } catch (erro) {
      mostrarErro(erro.message);
    }
  }

  function renderizarTabelaDespesas(despesas) {
    corpoTabelaDespesas.innerHTML = "";
    if (despesas.length === 0) {
      corpoTabelaDespesas.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhuma despesa cadastrada.</td></tr>`;
      return;
    }
    despesas
      .sort((a, b) => b.id - a.id)
      .forEach((despesa) => {
        const linha = corpoTabelaDespesas.insertRow();
        linha.insertCell(0).textContent = despesa.id;
        linha.insertCell(1).textContent = despesa.nome_despesa;
        linha.cells[1].classList.add("expense-name");
        linha.insertCell(2).textContent = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(despesa.valor);
        linha.insertCell(3).textContent = despesa.data_despesa
          ? new Date(despesa.data_despesa).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })
          : "N/A";
        linha.insertCell(4).textContent = despesa.data_vencimento_mensal
          ? new Date(despesa.data_vencimento_mensal).toLocaleDateString(
              "pt-BR",
              { timeZone: "UTC" }
            )
          : "N/A";

        const categoriaCell = linha.insertCell(5);
        if (despesa.categoria) {
          const tag = document.createElement("span");
          tag.className = "category-tag";
          tag.textContent = despesa.categoria.nome;
          categoriaCell.appendChild(tag);
        } else {
          categoriaCell.textContent = "N/A";
        }

        const celulaAcoes = linha.insertCell(6);
        celulaAcoes.classList.add("table-actions");

        const botaoEditar = document.createElement("button");
        botaoEditar.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        botaoEditar.classList.add("btn-edit");
        botaoEditar.title = "Editar Despesa";
        botaoEditar.addEventListener("click", () => abrirModalEdicao(despesa));
        celulaAcoes.appendChild(botaoEditar);

        const botaoExcluir = document.createElement("button");
        botaoExcluir.innerHTML = '<i class="fas fa-trash-alt"></i>';
        botaoExcluir.classList.add("btn-delete");
        botaoExcluir.title = "Excluir Despesa";
        botaoExcluir.addEventListener("click", () =>
          excluirDespesa(despesa.id)
        );
        celulaAcoes.appendChild(botaoExcluir);
      });
  }

  async function salvarDespesa(evento) {
    evento.preventDefault();
    const id = expenseIdInput.value;
    const isEditing = !!id;

    const dadosDespesa = {
      nome_despesa: nomeDespesaInput.value,
      valor: parseFloat(valorInput.value),
      data_despesa: dataDespesaInput.value || null,
      data_vencimento_mensal: dataVencimentoInput.value || null,
      categoria_id: parseInt(categoriaSelect.value),
    };

    const url = isEditing
      ? `${URL_BASE_API}/atualizar_despesa`
      : `${URL_BASE_API}/cadastrar_despesas`;
    const method = isEditing ? "PUT" : "POST";

    if (isEditing) {
      dadosDespesa.despesa_id = parseInt(id);
    }

    try {
      const resposta = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosDespesa),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.message ||
            `Erro ao ${isEditing ? "atualizar" : "adicionar"} despesa.`
        );
      }

      mostrarToast(
        `Despesa ${isEditing ? "atualizada" : "adicionada"} com sucesso!`
      );
      fecharModalPrincipal();
      buscarEExibirDespesas();
    } catch (erro) {
      mostrarToast(erro.message, "error");
    }
  }

  function excluirDespesa(idDespesa) {
    showConfirmModal(
      `Tem certeza que deseja excluir a despesa ID ${idDespesa}?`,
      async () => {
        try {
          const resposta = await fetch(`${URL_BASE_API}/deletar_despesa`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ despesa_id: idDespesa }),
          });
          if (resposta.ok) {
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
    );
  }

  function abrirModalAdicao() {
    expenseForm.reset();
    expenseIdInput.value = "";
    modalTitle.textContent = "Adicionar Nova Despesa";
    carregarCategorias(categoriaSelect);
    expenseModal.classList.remove("hidden");
  }

  function abrirModalEdicao(despesa) {
    expenseForm.reset();
    modalTitle.textContent = "Editar Despesa";

    expenseIdInput.value = despesa.id;
    nomeDespesaInput.value = despesa.nome_despesa;
    valorInput.value = parseFloat(despesa.valor).toFixed(2);
    dataDespesaInput.value = formatarDataParaInput(despesa.data_despesa);
    dataVencimentoInput.value = formatarDataParaInput(
      despesa.data_vencimento_mensal
    );

    carregarCategorias(categoriaSelect, despesa.categoria?.nome);

    expenseModal.classList.remove("hidden");
  }

  function fecharModalPrincipal() {
    expenseModal.classList.add("hidden");
  }

  function showConfirmModal(text, callback) {
    confirmModalText.textContent = text;
    onConfirmCallback = callback;
    confirmModal.classList.remove("hidden");
  }

  function hideConfirmModal() {
    confirmModal.classList.add("hidden");
    onConfirmCallback = null;
  }

  // --- Event Listeners ---
  botaoAdicionarDespesa.addEventListener("click", abrirModalAdicao);
  closeModalBtn.addEventListener("click", fecharModalPrincipal);
  cancelBtn.addEventListener("click", fecharModalPrincipal);
  expenseModal.addEventListener("click", (e) => {
    if (e.target === expenseModal) fecharModalPrincipal();
  });
  expenseForm.addEventListener("submit", salvarDespesa);

  confirmOkBtn.addEventListener("click", () => {
    if (typeof onConfirmCallback === "function") {
      onConfirmCallback();
    }
    hideConfirmModal();
  });
  confirmCancelBtn.addEventListener("click", hideConfirmModal);
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) hideConfirmModal();
  });

  // --- Inicialização ---
  buscarEExibirDespesas();
});
