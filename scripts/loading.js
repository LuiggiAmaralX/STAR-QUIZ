/**
 * Sistema de Loading States
 * Gerencia spinners e estados de carregamento em toda a aplicação
 */

class LoadingManager {
    constructor() {
        this.activeLoadings = new Set();
        this.overlay = null;
        this.init();
    }

    init() {
        // Cria o overlay de loading global se não existir
        if (!document.querySelector('.loading-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <div class="loading-text">Carregando...</div>
                    <div class="loading-subtext">Aguarde um momento</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.querySelector('.loading-overlay');
        }
    }

    /**
     * Exibe loading global com overlay
     * @param {string} text - Texto principal
     * @param {string} subtext - Texto secundário
     */
    showGlobal(text = 'Carregando...', subtext = 'Aguarde um momento') {
        
        const textElement = this.overlay.querySelector('.loading-text');
        const subtextElement = this.overlay.querySelector('.loading-subtext');
        
        if (textElement) textElement.textContent = text;
        if (subtextElement) subtextElement.textContent = subtext;
        
        this.overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Oculta loading global
     */
    hideGlobal() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * Adiciona loading a um botão
     * @param {HTMLElement|string} button - Elemento ou seletor do botão
     * @param {string} loadingText - Texto durante loading (opcional)
     */
    showButton(button, loadingText = null) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        // Salva o texto original
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
        }

        btn.classList.add('button-loading');
        btn.disabled = true;

        if (loadingText) {
            btn.innerHTML = loadingText;
        }

        this.activeLoadings.add(btn);
    }

    /**
     * Remove loading de um botão
     * @param {HTMLElement|string} button - Elemento ou seletor do botão
     */
    hideButton(button) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        btn.classList.remove('button-loading');
        btn.disabled = false;

        // Restaura o texto original
        if (btn.dataset.originalText) {
            btn.innerHTML = btn.dataset.originalText;
        }

        this.activeLoadings.delete(btn);
    }

    /**
     * Adiciona loading a um input
     * @param {HTMLElement|string} input - Elemento ou seletor do input
     */
    showInput(input) {
        const inp = typeof input === 'string' ? document.querySelector(input) : input;
        if (!inp) return;

        inp.classList.add('input-loading');
        inp.disabled = true;
        this.activeLoadings.add(inp);
    }

    /**
     * Remove loading de um input
     * @param {HTMLElement|string} input - Elemento ou seletor do input
     */
    hideInput(input) {
        const inp = typeof input === 'string' ? document.querySelector(input) : input;
        if (!inp) return;

        inp.classList.remove('input-loading');
        inp.disabled = false;
        this.activeLoadings.delete(inp);
    }

    /**
     * Adiciona loading a um card de categoria
     * @param {HTMLElement|string} card - Elemento ou seletor do card
     */
    showCard(card) {
        const cardElement = typeof card === 'string' ? document.querySelector(card) : card;
        if (!cardElement) return;

        cardElement.classList.add('loading');
        this.activeLoadings.add(cardElement);
    }

    /**
     * Remove loading de um card de categoria
     * @param {HTMLElement|string} card - Elemento ou seletor do card
     */
    hideCard(card) {
        const cardElement = typeof card === 'string' ? document.querySelector(card) : card;
        if (!cardElement) return;

        cardElement.classList.remove('loading');
        this.activeLoadings.delete(cardElement);
    }

    /**
     * Cria skeleton loading para lista de jogadores
     * @param {HTMLElement|string} container - Container da lista
     * @param {number} count - Número de skeletons
     */
    showPlayersSkeleton(container, count = 3) {
        const cont = typeof container === 'string' ? document.querySelector(container) : container;
        if (!cont) return;

        const skeletonHTML = Array.from({ length: count }, () => `
            <li class="player-skeleton">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton-info">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </li>
        `).join('');

        cont.innerHTML = skeletonHTML;
        cont.classList.add('players-loading');
    }

    /**
     * Remove skeleton loading da lista de jogadores
     * @param {HTMLElement|string} container - Container da lista
     */
    hidePlayersSkeleton(container) {
        const cont = typeof container === 'string' ? document.querySelector(container) : container;
        if (!cont) return;

        cont.classList.remove('players-loading');
    }

    /**
     * Exibe loading para perguntas
     * @param {HTMLElement|string} container - Container da pergunta
     */
    showQuestion(container) {
        const cont = typeof container === 'string' ? document.querySelector(container) : container;
        if (!cont) return;

        cont.innerHTML = `
            <div class="question-loading">
                <div class="spinner"></div>
                <div class="loading-text">Carregando pergunta...</div>
                <div class="loading-subtext">Preparando o desafio</div>
            </div>
        `;
    }

    /**
     * Adiciona loading dots a um elemento
     * @param {HTMLElement|string} element - Elemento
     * @param {string} text - Texto antes dos dots
     */
    showDots(element, text = 'Carregando') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        el.innerHTML = `
            ${text}
            <span class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;
    }

    /**
     * Remove todos os loadings ativos
     */
    hideAll() {
        this.hideGlobal();
        
        this.activeLoadings.forEach(element => {
            if (element.classList.contains('button-loading')) {
                this.hideButton(element);
            } else if (element.classList.contains('input-loading')) {
                this.hideInput(element);
            } else if (element.classList.contains('loading')) {
                this.hideCard(element);
            }
        });
        
        this.activeLoadings.clear();
    }

    /**
     * Executa uma função com loading global
     * @param {Function} asyncFunction - Função assíncrona
     * @param {string} text - Texto do loading
     * @param {string} subtext - Subtexto do loading
     */
    async withGlobalLoading(asyncFunction, text = 'Carregando...', subtext = 'Aguarde um momento') {
        this.showGlobal(text, subtext);
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            this.hideGlobal();
        }
    }

    /**
     * Executa uma função com loading em botão
     * @param {HTMLElement|string} button - Botão
     * @param {Function} asyncFunction - Função assíncrona
     * @param {string} loadingText - Texto durante loading
     */
    async withButtonLoading(button, asyncFunction, loadingText = null) {
        this.showButton(button, loadingText);
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            this.hideButton(button);
        }
    }

    /**
     * Simula loading com delay (para demonstração)
     * @param {number} duration - Duração em ms
     */
    async simulate(duration = 2000) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }
}

// Cria instância global
const loading = new LoadingManager();

// Funções de conveniência globais
function showLoading(text, subtext) {
    loading.showGlobal(text, subtext);
}

function hideLoading() {
    loading.hideGlobal();
}

function showButtonLoading(button, text) {
    loading.showButton(button, text);
}

function hideButtonLoading(button) {
    loading.hideButton(button);
}

function showCardLoading(card) {
    loading.showCard(card);
}

function hideCardLoading(card) {
    loading.hideCard(card);
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.loading = loading;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.showButtonLoading = showButtonLoading;
    window.hideButtonLoading = hideButtonLoading;
    window.showCardLoading = showCardLoading;
    window.hideCardLoading = hideCardLoading;
}

// Auto-inicialização removida para evitar duplicação
// A inicialização já ocorre no constructor da classe