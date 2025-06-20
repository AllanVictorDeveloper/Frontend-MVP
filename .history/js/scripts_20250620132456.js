document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000'; // Sua URL base da API
    const despesasTableBody = document.getElementById('despesas-table-body');
    const categoriaSelect = document.getElementById('categoria_id');
    const addDespesaBtn = document.getElementById('add-despesa-btn');
    const addDespesaFormContainer = document.getElementById('add-despesa-form-container');
    const addDespesaForm = document.getElementById('add-despesa-form');
    const cancelAddDespesaBtn = document.getElementById('cancel-add-despesa');
    const dataDespesaInput = document.getElementById('data_despesa');

     

    // Funções para manipulação do DOM
    function showLoading() {
        despesasTableBody.innerHTML = '<tr><td colspan="8">Carregando despesas...</td></tr>';
    }

    function hideLoading() {
        // Nada a fazer, o conteúdo será substituído
    }

    function showError(message) {
        despesasTableBody.innerHTML = `<tr><td colspan="8" style="color: red;">Erro: ${message}</td></tr>`;
    }

    // --- Funções de Interação com a API ---

    // Função para carregar categorias e preencher o select
    async function loadCategorias() {
        try {
            const response = await fetch(`${API_BASE_URL}/categorias`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar categorias.');
            }
            const data = await response.json();
            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            data.categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nome;
                categoriaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            // alert('Não foi possível carregar as categorias: ' + error.message);
        }
    }


    // Função para buscar e exibir despesas
    async function fetchAndDisplayDespesas() {
        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/despesas`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar despesas.');
            }
            const data = await response.json();
            renderDespesasTable(data.despesas);
        } catch (error) {
            console.error('Erro ao buscar despesas:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // Função para renderizar a tabela de despesas
    function renderDespesasTable(despesas) {
        despesasTableBody.innerHTML = ''; // Limpa o corpo da tabela
        if (despesas.length === 0) {
            despesasTableBody.innerHTML = '<tr><td colspan="8">Nenhuma despesa cadastrada.</td></tr>';
            return;
        }

        despesas.forEach(despesa => {
            const row = despesasTableBody.insertRow();
            row.insertCell(0).textContent = despesa.id;
            row.insertCell(1).textContent = despesa.nome_despesa;
            row.insertCell(2).textContent = `R$ ${despesa.valor.toFixed(2)}`;
            row.insertCell(3).textContent =new Date(despesa.data_despesa).toLocaleDateString('pt-BR')  || 'N/A';
            row.insertCell(4).textContent = new Date(despesa.data_vencimento_mensal).toLocaleDateString('pt-BR');
            row.insertCell(5).textContent = despesa.categoria ? despesa.categoria.nome : 'N/A'; // Acesse despesa.categoria.nome
            
            // Coluna de Ações
            const actionsCell = row.insertCell(6);
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.title = 'Excluir Despesa';
            deleteBtn.addEventListener('click', () => deleteDespesa(despesa.id));
            actionsCell.appendChild(deleteBtn);
            // Poderia adicionar botão de editar aqui também
        });
    }

    // Função para deletar despesa
    async function deleteDespesa(despesa_id) {
        console.log("id despesa:", despesa_id);
        if (!confirm(`Tem certeza que deseja excluir a despesa ID ${despesa_id}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/despesas`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ despesa_id: despesa_id })
        });

            if (response.status === 204) { // 204 No Content para deleção bem-sucedida
                alert('Despesa excluída com sucesso!');
                fetchAndDisplayDespesas(); // Recarrega a lista
            } else if (response.status === 404) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Despesa não encontrada.');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao excluir despesa.');
            }
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
            alert('Não foi possível excluir a despesa: ' + error.message);
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

        // Converte valor para float
        despesaData.valor = parseFloat(despesaData.valor);
        // categoria_id já deve ser int pelo select
        despesaData.categoria_id = parseInt(despesaData.categoria_id);
        
        // Se data_despesa for vazia, envia como null (se o seu backend aceitar)
        if (despesaData.data_despesa === '') {
            despesaData.data_despesa = null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/despesas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(despesaData)
            });

            if (response.status === 201) { // 201 Created
                alert('Despesa adicionada com sucesso!');
                addDespesaForm.reset(); // Limpa o formulário
                addDespesaFormContainer.style.display = 'none'; // Esconde o formulário
                fetchAndDisplayDespesas(); // Recarrega a lista
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao adicionar despesa.');
            }
        } catch (error) {
            console.error('Erro ao adicionar despesa:', error);
            alert('Não foi possível adicionar a despesa: ' + error.message);
        }
    }

// --- Nova Função para Definir a Data Máxima ---
    function setMaxDateForDespesa() {
        const today = new Date();
        const year = today.getFullYear();
        // Mês e dia precisam ter 2 dígitos (ex: 01, 09)
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Mês é 0-11, então +1
        const day = String(today.getDate()).padStart(2, '0');

        const maxDate = `${year}-${month}-${day}`;
        dataDespesaInput.setAttribute('max', maxDate);
    }
    
   
    // --- Event Listeners ---
    addDespesaBtn.addEventListener('click', () => {
        addDespesaFormContainer.style.display = 'block';
        
        loadCategorias(); // Carrega as categorias ao abrir o formulário
    });

    cancelAddDespesaBtn.addEventListener('click', () => {
        addDespesaFormContainer.style.display = 'none'; // Esconde o formulário
        addDespesaForm.reset(); // Limpa o formulário
    });

    addDespesaForm.addEventListener('submit', addDespesa);

    // Carregar despesas ao iniciar a página
    fetchAndDisplayDespesas();
    setMaxDateForDespesa();
    loadCategorias(); // Carrega categorias para o caso de o formulário ser aberto logo de cara
});