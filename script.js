const crachasRankingEl = document.getElementById('crachas-ranking');
const rankingContainerEl = document.getElementById('ranking-container');
const sucessoContainerEl = document.getElementById('sucesso-container');
const nomeSucessoEl = document.getElementById('nome-sucesso');

const BASE_PATH = '/amostra'; 

async function registrarAvaliacao(funcionarioSlug) {
    if (!funcionarioSlug) return;

    const ref = database.ref(`funcionarios/${funcionarioSlug}`);
    
    ref.transaction((funcionario) => {
        if (funcionario) {
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

function ouvirAtualizacoesDoRanking() {
    const ref = database.ref('funcionarios');

    ref.on('value', (snapshot) => {
        const dadosFuncionarios = snapshot.val();
        
        if (!dadosFuncionarios) {
            crachasRankingEl.innerHTML = '<p>Nenhum funcionário cadastrado no ranking.</p>';
            return;
        }

        const arrayFuncionarios = Object.keys(dadosFuncionarios).map(key => {
            return {
                slug: key, 
                ...dadosFuncionarios[key]
            };
        });

        arrayFuncionarios.sort((a, b) => (b.avaliacoes || 0) - (a.avaliacoes || 0));

        renderizarRanking(arrayFuncionarios);

    }, (error) => {
        console.error("Erro ao ler dados do Firebase:", error);
        crachasRankingEl.innerHTML = '<p>Erro ao carregar o ranking.</p>';
    });
}

function criarCrachaHTML(funcionario) {
    let iconesHTML = '';
    const numAvaliacoes = funcionario.avaliacoes || 0;
    
    let tamanhoFonteEstrela = '1.2rem'; 
    
    if (numAvaliacoes >= 7 && numAvaliacoes <= 12) {
        tamanhoFonteEstrela = '0.9rem'; 
    } else if (numAvaliacoes > 12) {
        tamanhoFonteEstrela = '0.7rem'; 
    }
    const styleEstrelas = `style="font-size: ${tamanhoFonteEstrela};"`;

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

function renderizarRanking(dados) {
    let htmlContent = dados.map(criarCrachaHTML).join('');
    crachasRankingEl.innerHTML = htmlContent;
}


function verificarRota() {
    let caminhoCompleto = window.location.pathname;

    if (caminhoCompleto.startsWith(BASE_PATH)) {
        caminhoCompleto = caminhoCompleto.substring(BASE_PATH.length);
    }

    const path = caminhoCompleto.split('/').filter(p => p);
    
    if (path.length > 0) {
        const funcionarioSlug = path[0]; 

        rankingContainerEl.classList.add('hidden');
        sucessoContainerEl.classList.remove('hidden');

        registrarAvaliacao(funcionarioSlug);
            
        const nomeFormatado = funcionarioSlug.replace(/-/g, ' ').toUpperCase();
        
        nomeSucessoEl.textContent = `Avaliação feita com sucesso para: ${nomeFormatado}! Redirecionando em 3 segundos...`;

        setTimeout(() => {
            window.location.href = BASE_PATH + '/'; 
        }, 3000); 
        
    } else {
        sucessoContainerEl.classList.add('hidden');
        rankingContainerEl.classList.remove('hidden');
        
        ouvirAtualizacoesDoRanking();
    }
}

document.addEventListener('DOMContentLoaded', verificarRota);
