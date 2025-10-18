// script.js

// ====================================================================
// REFERÊNCIAS AO HTML
// ====================================================================
const crachasRankingEl = document.getElementById('crachas-ranking');
const rankingContainerEl = document.getElementById('ranking-container');
const sucessoContainerEl = document.getElementById('sucesso-container');
const nomeSucessoEl = document.getElementById('nome-sucesso');

// ====================================================================
// FUNÇÕES DE MANIPULAÇÃO DO FIREBASE
// ====================================================================

/**
 * Registra uma nova avaliação no Firebase. Usa uma transação para garantir que a contagem seja correta.
 * @param {string} funcionarioSlug - O ID do funcionário no Firebase (ex: 'joao-pixel').
 */
async function registrarAvaliacao(funcionarioSlug) {
    if (!funcionarioSlug) return;

    // Refere-se ao caminho do funcionário no Realtime Database: /funcionarios/{slug}
    const ref = database.ref(`funcionarios/${funcionarioSlug}`);
    
    // Transação para garantir que a atualização de contagem seja atômica
    ref.transaction((funcionario) => {
        if (funcionario) {
            // Incrementa a contagem de avaliações
            funcionario.avaliacoes = (funcionario.avaliacoes || 0) + 1;
        }
        return funcionario;
    })
    .then((result) => {
        if (result.committed) {
            console.log(`Avaliação registrada para ${funcionarioSlug}`);
        } else {
            console.warn(`Transação abortada para ${funcionarioSlug}.`);
        }
    })
    .catch((error) => {
        console.error("Erro ao registrar avaliação:", error);
    });
}

/**
 * Escuta as mudanças no Firebase e atualiza o ranking em tempo real.
 * Ordena os funcionários por 'avaliacoes' (do maior para o menor).
 */
function ouvirAtualizacoesDoRanking() {
    const ref = database.ref('funcionarios');

    ref.on('value', (snapshot) => {
        const dadosFuncionarios = snapshot.val();
        
        if (!dadosFuncionarios) {
            crachasRankingEl.innerHTML = '<p>Nenhum funcionário cadastrado no ranking.</p>';
            return;
        }

        // Converte o objeto de dados do Firebase em um array para ordenação
        const arrayFuncionarios = Object.keys(dadosFuncionarios).map(key => {
            return {
                slug: key, // Mantém a chave do Firebase como ID/Slug
                ...dadosFuncionarios[key]
            };
        });

        // Ordena por número de avaliações (do maior para o menor) - Quem tem mais fica no topo!
        arrayFuncionarios.sort((a, b) => (b.avaliacoes || 0) - (a.avaliacoes || 0));

        // Renderiza o ranking
        renderizarRanking(arrayFuncionarios);

    }, (error) => {
        console.error("Erro ao ler dados do Firebase:", error);
        crachasRankingEl.innerHTML = '<p>Erro ao carregar o ranking.</p>';
    });
}

// ====================================================================
// FUNÇÕES DE RENDERIZAÇÃO E ROTEAMENTO
// ====================================================================

/**
 * Cria o HTML para um único crachá, ajustando o tamanho das estrelas.
 * @param {Object} funcionario - Objeto funcionário.
 * @returns {string} O HTML do crachá.
 */
function criarCrachaHTML(funcionario) {
    let iconesHTML = '';
    const numAvaliacoes = funcionario.avaliacoes || 0;
    
    // =================================================================
    // LÓGICA DE ESCALA DE TAMANHO DA FONTE DAS ESTRELAS
    // =================================================================
    let tamanhoFonteEstrela = '1.2rem'; 
    
    if (numAvaliacoes >= 7 && numAvaliacoes <= 12) {
        tamanhoFonteEstrela = '0.9rem'; 
    } else if (numAvaliacoes > 12) {
        tamanhoFonteEstrela = '0.7rem'; 
    }
    const styleEstrelas = `style="font-size: ${tamanhoFonteEstrela};"`;


    // Gera um ícone pixelado (⭐) para cada avaliação.
    for (let i = 0; i < numAvaliacoes; i++) {
        iconesHTML += `<span class="pixel-icon" ${styleEstrelas}>⭐</span>`;
    }

    return `
        <div class="cracha-item" data-slug="${funcionario.slug}">
            <div class="cracha-bg">
                <img src="${funcionario.cracha_img}" alt="Crachá de ${funcionario.nome}" class="cracha-imagem">
                <div class="icones-avaliacao">
                    ${iconesHTML}
                </div>
            </div>
            <p class="nome-funcionario">${funcionario.nome}</p>
        </div>
    `;
}

/**
 * Renderiza o ranking completo no DOM.
 * @param {Array} dados - Array de objetos funcionários.
 */
function renderizarRanking(dados) {
    let htmlContent = dados.map(criarCrachaHTML).join('');
    crachasRankingEl.innerHTML = htmlContent;
}


/**
 * Verifica a URL e decide qual página exibir (Ranking ou Sucesso), 
 * aplicando o temporizador de 3s na tela de sucesso.
 */
function verificarRota() {
    // Pega o último segmento da URL (que deve ser o slug do funcionário)
    const path = window.location.pathname.split('/').filter(p => p);
    
    if (path.length > 0) {
        // Rota de Avaliação (/nomedofuncionario)
        const funcionarioSlug = path[path.length - 1]; 

        // 1. Esconde o Ranking e mostra a tela de Sucesso
        rankingContainerEl.classList.add('hidden');
        sucessoContainerEl.classList.remove('hidden');

        // 2. Registra a avaliação no Firebase
        registrarAvaliacao(funcionarioSlug);
            
        // 3. Atualiza a mensagem de sucesso na tela
        const nomeFormatado = funcionarioSlug.replace(/-/g, ' ').toUpperCase();
        nomeSucessoEl.textContent = `Avaliação feita com sucesso para: ${nomeFormatado}! Redirecionando em 3 segundos...`;
        
        // 4. Temporizador de 3 segundos para redirecionar para o ranking
        setTimeout(() => {
            // Volta para a página principal (o ranking)
            window.location.href = '/'; 
        }, 3000); // 3000 milissegundos = 3 segundos
        
    } else {
        // Rota do Ranking Principal (/)
        sucessoContainerEl.classList.add('hidden');
        rankingContainerEl.classList.remove('hidden');
        
        // Inicia a escuta em tempo real do Firebase
        ouvirAtualizacoesDoRanking();
    }
}

// Inicia a aplicação após o carregamento do DOM
document.addEventListener('DOMContentLoaded', verificarRota);