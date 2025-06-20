document.addEventListener("DOMContentLoaded", () => {
  const URL_BASE_API = "http://127.0.0.1:5000"; // URL base da API

  // Elementos do DOM - Globalmente acessíveis
  const corpoTabelaDespesas = document.getElementById("despesas-table-body");
  const selectCategoriaAdicao = document.getElementById("categoria_id");
  const botaoAdicionarDespesa = document.getElementById("add-despesa-btn");
  const containerFormAdicionarDespesa = document.getElementById(
    "add-despesa-form-container"
  );
  const formularioAdicionarDespesa =
    document.getElementById("add-despesa-form");
  const botaoCancelarAdicaoDespesa =
    document.getElementById("cancel-add-despesa");
  const inputDataDespesaAdicao = document.getElementById("data_despesa"); // Input de data no formulário de adição
  const containerTabelaDespesas = document.querySelector(".table-container");

  // Elementos do Modal de Edição
  const modalDetalhesDespesa = document.getElementById("expense-details-modal"); // ID original do HTML
  const botaoFecharModal = modalDetalhesDespesa.querySelector(".close-button");
  const formularioEditarDespesa = document.getElementById("edit-expense-form");
  const botaoCancelarEdicaoDespesa = document.getElementById(
    "cancel-edit-expense"
  );

  // Inputs específicos do formulário de edição dentro do modal
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

  // --- Funções para manipulação do DOM e Feedback ao Usuário ---

  function mostrarCarregamento() {
    corpoTabelaDespesas.innerHTML =
      '<tr><td colspan="8">Carregando despesas...</td></tr>';
  }

  function mostrarErro(mensagem) {
    corpoTabelaDespesas.innerHTML = `<tr><td colspan="8" style="color: red;">Erro: ${mensagem}</td></tr>`;
  }

  // --- Função auxiliar para formatar datas (já aprimorada) ---
  const formatarDataParaInput = (stringData) => {
    if (!stringData) return ""; // Retorna vazio se a string for nula ou vazia

    try {
      const data = new Date(stringData);

      if (isNaN(data.getTime())) {
        console.warn("Data inválida recebida:", stringData);
        return ""; // Retorna vazio se a data for inválida
      }

      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0"); // Mês é 0-11, então +1
      const dia = String(data.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}`;
    } catch (e) {
      console.error("Erro ao processar data:", stringData, e);
      return ""; // Retorna vazio em caso de erro na conversão
    }
  };

  // --- Funções de Interação com a API ---

  // Função para carregar categorias e preencher o select de ADIÇÃO
  async function carregarCategoriasAdicao() {
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_categorias`);
      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao carregar categorias.");
      }
      const dados = await resposta.json();
      selectCategoriaAdicao.innerHTML =
        '<option value="">Selecione uma categoria</option>'; // Opção padrão
      dados.categorias.forEach((categoria) => {
        const opcao = document.createElement("option");
        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;
        selectCategoriaAdicao.appendChild(opcao);
      });
    } catch (erro) {
      console.error(
        "Erro ao carregar categorias para formulário de adição:",
        erro
      );
      alert(
        "Não foi possível carregar as categorias para adição: " + erro.message
      );
    }
  }

  // Função para preencher o select de categorias NO MODAL DE EDIÇÃO
  async function popularCategoriasParaModal(categoriaItem) {
    // Renomeado para refletir que recebe o ID
    selectCategoriaEdicao.innerHTML = '<option value="">Carregando...</option>';
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_categorias`);
      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        throw new Error(
          dadosErro.message || "Erro ao carregar categorias para o modal."
        );
      }
      const dados = await resposta.json();
      const categorias = dados.categorias;

      selectCategoriaEdicao.innerHTML =
        '<option value="">Selecione uma categoria</option>'; // Opção padrão
      categorias.forEach((categoria) => {
        const opcao = document.createElement("option");
        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;
        // Agora compara o ID diretamente para pré-selecionar
        if (categoriaItem.nome === categoria.nome) {
          opcao.selected = true;
        }
        selectCategoriaEdicao.appendChild(opcao);
      });
    } catch (erro) {
      console.error("Erro ao carregar categorias para o modal:", erro);
      selectCategoriaEdicao.innerHTML =
        '<option value="">Erro ao carregar categorias</option>';
      alert(
        "Não foi possível carregar as categorias para edição: " + erro.message
      );
    }
  }

  // Função para buscar e exibir despesas
  async function buscarEExibirDespesas() {
    mostrarCarregamento();
    try {
      const resposta = await fetch(`${URL_BASE_API}/buscar_despesas`);
      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao buscar despesas.");
      }
      const dados = await resposta.json();
      renderizarTabelaDespesas(dados.despesas);
    } catch (erro) {
      console.error("Erro ao buscar despesas:", erro);
      mostrarErro(erro.message);
    }
  }

  // Função para renderizar a tabela de despesas
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

      // Coluna de Ações
      const celulaAcoes = linha.insertCell(6);
      celulaAcoes.classList.add("table-actions");

      const botaoEditar = document.createElement("button");
      botaoEditar.innerHTML = '<i class="fas fa-edit"></i>';
      botaoEditar.classList.add("btn-edit");
      botaoEditar.title = "Editar Despesa";
      botaoEditar.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirModalEdicao(despesa); // Passa o objeto completo da despesa
      });
      celulaAcoes.appendChild(botaoEditar);

      const botaoExcluir = document.createElement("button");
      botaoExcluir.innerHTML = '<i class="fas fa-trash"></i>';
      botaoExcluir.classList.add("btn-delete");
      botaoExcluir.style.color = "#e74c3c";
      botaoExcluir.title = "Excluir Despesa";
      botaoExcluir.addEventListener("click", (e) => {
        e.stopPropagation();
        excluirDespesa(despesa.id);
      });
      celulaAcoes.appendChild(botaoExcluir);
    });
  }

  // Função para deletar despesa
  async function excluirDespesa(idDespesa) {
    if (!confirm(`Tem certeza que deseja excluir a despesa ID ${idDespesa}?`)) {
      return;
    }

    try {
      const resposta = await fetch(`${URL_BASE_API}/deletar_despesa`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ despesa_id: idDespesa }),
      });

      if (resposta.status === 204) {
        alert("Despesa excluída com sucesso!");
        buscarEExibirDespesas(); // Recarrega a lista
      } else if (resposta.status === 404) {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Despesa não encontrada.");
      } else {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao excluir despesa.");
      }
    } catch (erro) {
      console.error("Erro ao excluir despesa:", erro);
      alert("Não foi possível excluir a despesa: " + erro.message);
    }
  }

  // Função para adicionar nova despesa
  async function adicionarDespesa(evento) {
    evento.preventDefault(); // Impede o envio padrão do formulário

    const dadosFormulario = new FormData(formularioAdicionarDespesa);
    const dadosDespesa = {};
    for (const [chave, valor] of dadosFormulario.entries()) {
      dadosDespesa[chave] = valor;
    }

    dadosDespesa.valor = parseFloat(dadosDespesa.valor);
    dadosDespesa.categoria_id = parseInt(dadosDespesa.categoria_id);

    // Ajusta para null se o campo de data estiver vazio
    dadosDespesa.data_despesa =
      dadosDespesa.data_despesa === "" ? null : dadosDespesa.data_despesa;
    dadosDespesa.data_vencimento_mensal =
      dadosDespesa.data_vencimento_mensal === ""
        ? null
        : dadosDespesa.data_vencimento_mensal;

    try {
      const resposta = await fetch(`${URL_BASE_API}/cadastrar_despesas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosDespesa),
      });

      if (resposta.status === 201) {
        alert("Despesa adicionada com sucesso!");
        formularioAdicionarDespesa.reset(); // Limpa o formulário
        containerFormAdicionarDespesa.style.display = "none"; // Esconde o formulário
        containerTabelaDespesas.style.display = "block"; // mostra a tabela de despesas
        buscarEExibirDespesas(); // Recarrega a lista
      } else {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao adicionar despesa.");
      }
    } catch (erro) {
      console.error("Erro ao adicionar despesa:", erro);
      alert("Não foi possível adicionar a despesa: " + erro.message);
    }
  }

  // --- Função para Definir a Data Máxima no input de Adição ---
  function definirDataMaximaParaDespesa() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const dataMaxima = `${ano}-${mes}-${dia}`;
    inputDataDespesaAdicao.setAttribute("max", dataMaxima);
  }

  // Função para abrir o modal e preencher os inputs com os dados da despesa
  async function abrirModalEdicao(despesa) {
    console.log("Abrindo modal de edição para a despesa:", despesa);

    inputIdDespesaEdicao.value = despesa.id;
    inputNomeDespesaEdicao.value = despesa.nome_despesa;
    inputValorDespesaEdicao.value = parseFloat(despesa.valor).toFixed(2);

    inputDataDespesaEdicao.value = formatarDataParaInput(despesa.data_despesa);
    inputDataVencimentoMensalEdicao.value = formatarDataParaInput(
      despesa.data_vencimento_mensal
    );

    // Passa o ID da categoria, se a categoria existir, senão passa null
    await popularCategoriasParaModal(
      despesa.categoria ? despesa.categoria : null
    );

    modalDetalhesDespesa.style.display = "flex"; // Exibe o modal
  }

  function fecharModalEdicao() {
    modalDetalhesDespesa.style.display = "none"; // Esconde o modal
    formularioEditarDespesa.reset(); // Limpa o formulário
  }

  // --- Event Listeners para o Modal de Edição ---
  botaoFecharModal.addEventListener("click", fecharModalEdicao);
  botaoCancelarEdicaoDespesa.addEventListener("click", fecharModalEdicao);

  // Fecha o modal se clicar fora do conteúdo do modal
  window.addEventListener("click", (evento) => {
    if (evento.target === modalDetalhesDespesa) {
      fecharModalEdicao();
    }
  });

  // --- Lidar com o envio do formulário de edição ---
  formularioEditarDespesa.addEventListener("submit", async (evento) => {
    evento.preventDefault(); // Impede o envio padrão do formulário

    const idDespesa = inputIdDespesaEdicao.value;
    const dadosDespesaAtualizados = {
      nome_despesa: inputNomeDespesaEdicao.value,
      valor: parseFloat(inputValorDespesaEdicao.value),
      data_despesa: inputDataDespesaEdicao.value || null, // Envia null se vazio
      data_vencimento_mensal: inputDataVencimentoMensalEdicao.value || null, // Envia null se vazio
      categoria_id: parseInt(selectCategoriaEdicao.value),
    };

    console.log("Dados a serem atualizados:", dadosDespesaAtualizados);

    try {
      const resposta = await fetch(
        `${URL_BASE_API}/atualizar_despesa/${idDespesa}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // 'Authorization': 'Bearer SEU_TOKEN' // Se precisar de autenticação
          },
          body: JSON.stringify(dadosDespesaAtualizados),
        }
      );

      if (!resposta.ok) {
        const dadosErro = await resposta.json();
        throw new Error(dadosErro.message || "Erro ao atualizar despesa.");
      }

      const resultado = await resposta.json();
      console.log("Despesa atualizada com sucesso:", resultado);

      buscarEExibirDespesas(); // Recarrega a lista de despesas atualizada
      fecharModalEdicao(); // Fecha o modal após o sucesso
      alert("Despesa atualizada com sucesso!"); // Feedback para o usuário
    } catch (erro) {
      console.error("Erro ao salvar edições da despesa:", erro);
      alert(`Erro ao atualizar despesa: ${erro.message}`); // Feedback de erro
    }
  });

  // --- Event Listeners para o formulário de Adição/Tabela ---
  botaoAdicionarDespesa.addEventListener("click", () => {
    containerFormAdicionarDespesa.style.display = "block";
    containerTabelaDespesas.style.display = "none"; // Esconde a tabela de despesas
    formularioAdicionarDespesa.reset(); // Limpa o formulário ao abrir
    carregarCategoriasAdicao(); // Carrega as categorias ao abrir o formulário de adição
  });

  botaoCancelarAdicaoDespesa.addEventListener("click", () => {
    containerFormAdicionarDespesa.style.display = "none"; // Esconde o formulário
    containerTabelaDespesas.style.display = "block"; // Mostra a tabela de despesas
  });

  formularioAdicionarDespesa.addEventListener("submit", adicionarDespesa);

  // --- Inicialização ---
  buscarEExibirDespesas(); // Carrega despesas ao iniciar
  definirDataMaximaParaDespesa(); // Define a data máxima para o input de data no formulário de adição
});
