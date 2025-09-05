/**
 * Sistema de Animações para STAR QUIZ
 * Gerencia transições suaves entre telas e estados
 */

class AnimationManager {
    constructor() {
        this.isAnimating = false;
        this.animationQueue = [];
        this.init();
    }

    init() {
        // Adiciona classes de transição aos elementos existentes
        this.addTransitionClasses();
        
        // Configura observador de mutações para novos elementos
        this.setupMutationObserver();
        
        // Adiciona event listeners para animações
        this.setupEventListeners();
    }

    addTransitionClasses() {
        // Adiciona transições suaves a elementos comuns
        const elements = {
            '.btn, button': 'smooth-transition-fast',
            'input, select, textarea': 'smooth-transition',
            '.category-card': 'smooth-transition',
            '.player-item': 'smooth-transition',
            '.notification': 'smooth-transition',
            'body, .container': 'dark-mode-transition'
        };

        Object.entries(elements).forEach(([selector, className]) => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.add(className);
            });
        });
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.animateNewElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupEventListeners() {
        // Animações para cliques em botões
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, button')) {
                this.addRippleEffect(e.target, e);
            }
        });

        // Animações para mudanças de tela
        document.addEventListener('screenChange', (e) => {
            this.transitionScreen(e.detail.from, e.detail.to);
        });
    }

    // Anima novos elementos adicionados ao DOM
    animateNewElement(element) {
        if (element.classList.contains('notification')) {
            element.classList.add('animate-slide-in-right');
        } else if (element.classList.contains('player-item')) {
            element.classList.add('animate-slide-in-left');
        } else if (element.classList.contains('answer-btn')) {
            element.classList.add('animate-slide-in-up');
        } else if (element.classList.contains('question-container')) {
            element.classList.add('animate-fade-in');
        }
    }

    // Adiciona efeito ripple aos botões
    addRippleEffect(button, event) {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Transição entre telas
    async transitionScreen(fromScreen, toScreen) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        try {
            // Anima saída da tela atual
            if (fromScreen) {
                fromScreen.classList.add('animate-fade-out');
                await this.waitForAnimation(fromScreen, 300);
                fromScreen.classList.remove('active', 'animate-fade-out');
            }

            // Anima entrada da nova tela
            if (toScreen) {
                toScreen.classList.add('active');
                toScreen.classList.add('animate-fade-in');
                await this.waitForAnimation(toScreen, 500);
                toScreen.classList.remove('animate-fade-in');
            }
        } finally {
            this.isAnimating = false;
        }
    }

    // Anima entrada de elementos
    animateIn(element, animationType = 'fadeIn', delay = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                element.classList.add(`animate-${animationType}`);
                this.waitForAnimation(element).then(() => {
                    element.classList.remove(`animate-${animationType}`);
                    resolve();
                });
            }, delay);
        });
    }

    // Anima saída de elementos
    animateOut(element, animationType = 'fadeOut') {
        return new Promise((resolve) => {
            element.classList.add(`animate-${animationType}`);
            this.waitForAnimation(element).then(() => {
                element.classList.remove(`animate-${animationType}`);
                resolve();
            });
        });
    }

    // Anima lista de elementos em sequência
    async animateList(elements, animationType = 'slide-in-up', stagger = 100) {
        const promises = Array.from(elements).map((element, index) => {
            return this.animateIn(element, animationType, index * stagger);
        });
        
        return Promise.all(promises);
    }

    // Anima resposta correta/incorreta
    animateAnswer(button, isCorrect) {
        return new Promise((resolve) => {
            if (isCorrect) {
                button.classList.add('correct', 'animate-bounce-in');
            } else {
                button.classList.add('incorrect', 'animate-scale-out');
            }
            
            setTimeout(() => {
                button.classList.remove('animate-bounce-in', 'animate-scale-out');
                resolve();
            }, 600);
        });
    }

    // Anima progresso/contagem regressiva
    animateProgress(element, from, to, duration = 1000) {
        return new Promise((resolve) => {
            const start = performance.now();
            const range = to - from;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                const current = from + (range * this.easeOutCubic(progress));
                
                if (element.style) {
                    element.style.width = `${current}%`;
                } else if (element.textContent !== undefined) {
                    element.textContent = Math.round(current);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Função de easing
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Aguarda o fim de uma animação
    waitForAnimation(element, duration = null) {
        return new Promise((resolve) => {
            if (duration) {
                setTimeout(resolve, duration);
            } else {
                const handleAnimationEnd = () => {
                    element.removeEventListener('animationend', handleAnimationEnd);
                    resolve();
                };
                element.addEventListener('animationend', handleAnimationEnd);
            }
        });
    }

    // Adiciona animação de hover programaticamente
    addHoverAnimation(element, hoverClass = 'animate-scale-in') {
        element.addEventListener('mouseenter', () => {
            element.classList.add(hoverClass);
        });
        
        element.addEventListener('mouseleave', () => {
            element.classList.remove(hoverClass);
        });
    }

    // Remove todas as classes de animação
    clearAnimations(element) {
        const animationClasses = [
            'animate-fade-in', 'animate-fade-out',
            'animate-slide-in-up', 'animate-slide-in-down',
            'animate-slide-in-left', 'animate-slide-in-right',
            'animate-slide-out-up', 'animate-slide-out-down',
            'animate-scale-in', 'animate-scale-out',
            'animate-bounce-in', 'correct', 'incorrect'
        ];
        
        element.classList.remove(...animationClasses);
    }

    // Pausa todas as animações
    pauseAnimations() {
        document.body.style.animationPlayState = 'paused';
    }

    // Resume todas as animações
    resumeAnimations() {
        document.body.style.animationPlayState = 'running';
    }

    // Desabilita animações (para acessibilidade)
    disableAnimations() {
        document.body.classList.add('no-animation');
    }

    // Habilita animações
    enableAnimations() {
        document.body.classList.remove('no-animation');
    }
}

// Instância global do gerenciador de animações
const animationManager = new AnimationManager();

// Funções de conveniência para uso global
window.animateIn = (element, type, delay) => animationManager.animateIn(element, type, delay);
window.animateOut = (element, type) => animationManager.animateOut(element, type);
window.animateList = (elements, type, stagger) => animationManager.animateList(elements, type, stagger);
window.animateAnswer = (button, isCorrect) => animationManager.animateAnswer(button, isCorrect);
window.animateProgress = (element, from, to, duration) => animationManager.animateProgress(element, from, to, duration);
window.transitionScreen = (from, to) => animationManager.transitionScreen(from, to);

// Adiciona CSS de animação ripple
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Detecta preferência de movimento reduzido
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animationManager.disableAnimations();
}

// Exporta o gerenciador para uso em outros scripts
window.animationManager = animationManager;