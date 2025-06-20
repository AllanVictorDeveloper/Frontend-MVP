document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://127.0.0.1:5000"; // Sua URL base da API

  // Elementos do DOM - Globalmente acessíveis
  const despesasTableBody = document.getElementById("despesas-table-body");
  const categoriaSelect = document.getElementById("categoria_id"); // Para o form de adicionar
  const addDespesaBtn = document.getElementById("add-despesa-btn");
  const addDespesaFormContainer = document.getElementById(
    "add-despesa-form-container"
  );
  const addDespesaForm = document.getElementById("add-despesa-form");
  const cancelAddDespesaBtn = document.getElementById("cancel-add-despesa");
  const dataDespesaInput = document.getElementById("data_despesa");
  const despesaContainetTable = document.querySelector(".table-container");

  // Elementos do Modal de Edição
  const expenseDetailsModal = document.getElementById("expense-details-modal");
  const closeButton = expenseDetailsModal.querySelector(".close-button");
  const editExpenseForm = document.getElementById("edit-expense-form");
  const cancelEditExpenseBtn = document.getElementById("cancel-edit-expense");

  // Inputs específicos do formulário de edição dentro do modal
  const editExpenseId = document.getElementById("edit-expense-id");
  const editExpenseName = document.getElementById("edit-expense-name");
  const editExpenseValue = document.getElementById("edit-expense-value");
  const editExpenseDate = document.getElementById("edit-expense-date");
  const editExpenseDueDate = document.getElementById("edit-expense-due-date");
  const editExpenseCategory = document.getElementById("edit-expense-category"); // Select de categoria do modal

  // --- Funções para manipulação do DOM e Feedback ao Usuário ---

  function showLoading() {
    despesasTableBody.innerHTML =
      '<tr><td colspan="8">Carregando despesas...</td></tr>';
  }

  // Não precisamos de hideLoading explícito se o conteúdo sempre substitui
  // function hideLoading() { }

  function showError(message) {
    despesasTableBody.innerHTML = `<tr><td colspan="8" style="color: red;">Erro: ${message}</td></tr>`;
  }

  // --- Funções de Interação com a API ---

  // Função para carregar categorias e preencher o select de ADIÇÃO
  async function loadCategorias() {
    try {
      const response = await fetch(`${API_BASE_URL}/buscar_categorias`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao carregar categorias.");
      }
      const data = await response.json();
      categoriaSelect.innerHTML =
        '<option value="">Selecione uma categoria</option>'; // Opção padrão
      data.categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = categoria.nome;
        categoriaSelect.appendChild(option);
      });
    } catch (error) {
      console.error(
        "Erro ao carregar categorias para formulário de adição:",
        error
      );
      alert(
        "Não foi possível carregar as categorias para adição: " + error.message
      );
    }
  }

  // Função para preencher o select de categorias NO MODAL DE EDIÇÃO
  async function populateCategoriesForModal(selectedCategoryId = null) {
    editExpenseCategory.innerHTML = '<option value="">Carregando...</option>';
    try {
      const response = await fetch(`${API_BASE_URL}/buscar_categorias`); // Use sua API_BASE_URL aqui
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao carregar categorias para o modal."
        );
      }
      const data = await response.json();
      const categories = data.categorias; // Ajuste para o formato da sua resposta da API

      editExpenseCategory.innerHTML =
        '<option value="">Selecione uma categoria</option>'; // Opção padrão
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.nome;
        if (selectedCategoryId && category.id === selectedCategoryId) {
          option.selected = true; // Pré-seleciona a categoria atual da despesa
        }
        editExpenseCategory.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar categorias para o modal:", error);
      editExpenseCategory.innerHTML =
        '<option value="">Erro ao carregar categorias</option>';
      alert(
        "Não foi possível carregar as categorias para edição: " + error.message
      );
    }
  }

  // Função para buscar e exibir despesas
  async function fetchAndDisplayDespesas() {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/buscar_despesas`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar despesas.");
      }
      const data = await response.json();
      renderDespesasTable(data.despesas);
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
      showError(error.message);
    }
    // Não precisamos de hideLoading no finally aqui, renderDespesasTable já sobrescreve
  }

  // Função para renderizar a tabela de despesas
  function renderDespesasTable(despesas) {
    despesasTableBody.innerHTML = "";
    if (despesas.length === 0) {
      despesasTableBody.innerHTML =
        '<tr><td colspan="8">Nenhuma despesa cadastrada.</td></tr>';
      return;
    }

    despesas.forEach((despesa) => {
      const row = despesasTableBody.insertRow();
      row.insertCell(0).textContent = despesa.id;
      row.insertCell(1).textContent = despesa.nome_despesa;
      row.insertCell(2).textContent = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(despesa.valor);
      row.insertCell(3).textContent = despesa.data_despesa
        ? new Date(despesa.data_despesa).toLocaleDateString("pt-BR")
        : "N/A";
      row.insertCell(4).textContent = despesa.data_vencimento_mensal
        ? new Date(despesa.data_vencimento_mensal).toLocaleDateString("pt-BR")
        : "N/A";
      // Garante que o nome da categoria seja exibido
      row.insertCell(5).textContent = despesa.categoria
        ? despesa.categoria.nome
        : "N/A";

      // Coluna de Ações
      const actionsCell = row.insertCell(6);
      actionsCell.classList.add("table-actions");

      const editBtn = document.createElement("button");
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.classList.add("btn-edit");
      editBtn.title = "Editar Despesa";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Impede que o clique na linha, se houver, também ative
        openEditModal(despesa); // Passa o objeto completo da despesa
      });
      actionsCell.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.classList.add("btn-delete");
      deleteBtn.style.color = "#e74c3c";
      deleteBtn.title = "Excluir Despesa";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Impede que o clique na linha, se houver, também ative
        deleteDespesa(despesa.id);
      });
      actionsCell.appendChild(deleteBtn);
    });
  }

  // Função para deletar despesa
  async function deleteDespesa(despesa_id) {
    if (
      !confirm(`Tem certeza que deseja excluir a despesa ID ${despesa_id}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/deletar_despesa`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ despesa_id: despesa_id }),
      });

      if (response.status === 204) {
        alert("Despesa excluída com sucesso!");
        fetchAndDisplayDespesas(); // Recarrega a lista
      } else if (response.status === 404) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Despesa não encontrada.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir despesa.");
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      alert("Não foi possível excluir a despesa: " + error.message);
    }
  }

  // Função para adicionar nova despesa
  async function addDespesa(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const formData = new FormData(addDespesaForm);
    const despesaData = {};
    for (const [key, value] of formData.entries()) {
      despesaData[key] = value;
    }

    despesaData.valor = parseFloat(despesaData.valor);
    despesaData.categoria_id = parseInt(despesaData.categoria_id);

    // Ajusta para null se o campo de data estiver vazio
    despesaData.data_despesa =
      despesaData.data_despesa === "" ? null : despesaData.data_despesa;
    despesaData.data_vencimento_mensal =
      despesaData.data_vencimento_mensal === ""
        ? null
        : despesaData.data_vencimento_mensal;

    try {
      const response = await fetch(`${API_BASE_URL}/cadastrar_despesas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(despesaData),
      });

      if (response.status === 201) {
        alert("Despesa adicionada com sucesso!");
        addDespesaForm.reset(); // Limpa o formulário
        addDespesaFormContainer.style.display = "none"; // Esconde o formulário
        despesaContainetTable.style.display = "block"; // mostra a tabela de despesas
        fetchAndDisplayDespesas(); // Recarrega a lista
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao adicionar despesa.");
      }
    } catch (error) {
      console.error("Erro ao adicionar despesa:", error);
      alert("Não foi possível adicionar a despesa: " + error.message);
    }
  }

  // --- Função para Definir a Data Máxima no input de Adição ---
  function setMaxDateForDespesa() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const maxDate = `${year}-${month}-${day}`;
    dataDespesaInput.setAttribute("max", maxDate);
  }

  // --- Funções do Modal de Edição ---

  // Função para abrir o modal e preencher os inputs com os dados da despesa
  async function openEditModal(expense) {
    editExpenseId.value = expense.id;
    editExpenseName.value = expense.nome_despesa;
    editExpenseValue.value = parseFloat(expense.valor).toFixed(2);

    // Função auxiliar para formatar uma data para YYYY-MM-DD
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
          console.warn("Data inválida recebida:", dateString);
          return "";
        }

        // Pega o ano, mês e dia e formata para YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês é 0-11, então +1
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error("Erro ao processar data:", dateString, e);
        return ""; // Retorna vazio em caso de erro na conversão
      }
    };

    editExpenseDate.value = formatDateForInput(expense.data_despesa);
    editExpenseDueDate.value = formatDateForInput(
      expense.data_vencimento_mensal
    );

    await populateCategoriesForModal(
      expense.categoria ? expense.categoria.id : null
    );

    expenseDetailsModal.style.display = "flex";
  }

  function closeEditModal() {
    expenseDetailsModal.style.display = "none"; // Esconde o modal
    editExpenseForm.reset(); // Limpa o formulário
  }

  // --- Event Listeners para o Modal de Edição ---
  closeButton.addEventListener("click", closeEditModal);
  cancelEditExpenseBtn.addEventListener("click", closeEditModal);

  // Fecha o modal se clicar fora do conteúdo do modal
  window.addEventListener("click", (event) => {
    if (event.target === expenseDetailsModal) {
      closeEditModal();
    }
  });

  // --- Lidar com o envio do formulário de edição ---
  editExpenseForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o envio padrão do formulário

    const expenseId = editExpenseId.value;
    const updatedExpenseData = {
      nome_despesa: editExpenseName.value,
      valor: parseFloat(editExpenseValue.value),
      data_despesa: editExpenseDate.value || null, // Envia null se vazio
      data_vencimento_mensal: editExpenseDueDate.value || null, // Envia null se vazio
      categoria_id: parseInt(editExpenseCategory.value),
    };

    console.log("Dados a serem atualizados:", updatedExpenseData);

    try {
      const response = await fetch(
        `${API_BASE_URL}/atualizar_despesa/${expenseId}`,
        {
          // Adapte para o seu endpoint de atualização
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // 'Authorization': 'Bearer SEU_TOKEN' // Se precisar de autenticação
          },
          body: JSON.stringify(updatedExpenseData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar despesa.");
      }

      const result = await response.json();
      console.log("Despesa atualizada com sucesso:", result);

      fetchAndDisplayDespesas(); // Recarrega a lista de despesas atualizada
      closeEditModal(); // Fecha o modal após o sucesso
      alert("Despesa atualizada com sucesso!"); // Feedback para o usuário
    } catch (error) {
      console.error("Erro ao salvar edições da despesa:", error);
      alert(`Erro ao atualizar despesa: ${error.message}`); // Feedback de erro
    }
  });

  // --- Event Listeners para o formulário de Adição/Tabela ---
  addDespesaBtn.addEventListener("click", () => {
    addDespesaFormContainer.style.display = "block";
    despesaContainetTable.style.display = "none"; // Esconde a tabela de despesas
    addDespesaForm.reset(); // Limpa o formulário ao abrir
    loadCategorias(); // Carrega as categorias ao abrir o formulário de adição
  });

  cancelAddDespesaBtn.addEventListener("click", () => {
    addDespesaFormContainer.style.display = "none"; // Esconde o formulário
    despesaContainetTable.style.display = "block"; // Mostra a tabela de despesas
  });

  addDespesaForm.addEventListener("submit", addDespesa);

  // --- Inicialização ---
  fetchAndDisplayDespesas(); // Carrega despesas ao iniciar
  setMaxDateForDespesa(); // Define a data máxima para o input de data no formulário de adição
  // loadCategorias(); // Não é mais necessário aqui, pois é chamado ao abrir o form ou o modal
});
