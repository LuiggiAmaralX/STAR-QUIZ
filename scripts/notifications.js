/**
 * Sistema de Notificações Elegantes
 * Substitui os alert() padrão por notificações modernas e elegantes
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        // Cria o container das notificações se não existir
        if (!document.querySelector('.notifications-container')) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.notifications-container');
        }
    }

    /**
     * Exibe uma notificação
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {Object} options - Opções adicionais
     */
    show(message, type = 'info', options = {}) {
        const config = {
            title: options.title || this.getDefaultTitle(type),
            duration: options.duration || 5000,
            closable: options.closable !== false,
            pulse: options.pulse || false,
            icon: options.icon || this.getDefaultIcon(type),
            ...options
        };

        const notification = this.createNotification(message, type, config);
        this.container.appendChild(notification);

        // Reproduz som baseado no tipo
        if (typeof window.playSound === 'function') {
            switch (type) {
                case 'success':
                    window.playSound('success');
                    break;
                case 'error':
                    window.playSound('error');
                    break;
                case 'warning':
                    window.playSound('notification');
                    break;
                case 'info':
                    window.playSound('notification');
                    break;
            }
        }

        // Anima a entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-remove após o tempo especificado
        if (config.duration > 0) {
            const progressBar = notification.querySelector('.notification-progress-bar');
            if (progressBar) {
                progressBar.style.animationDuration = `${config.duration}ms`;
            }

            setTimeout(() => {
                this.remove(notification);
            }, config.duration);
        }

        // Armazena a notificação
        const id = Date.now() + Math.random();
        this.notifications.set(id, notification);

        return id;
    }

    /**
     * Cria o elemento HTML da notificação
     */
    createNotification(message, type, config) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        if (config.pulse) {
            notification.classList.add('pulse');
        }

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${config.icon}"></i>
            </div>
            <div class="notification-content">
                ${config.title ? `<div class="notification-title">${config.title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            ${config.closable ? '<button class="notification-close"><i class="fas fa-times"></i></button>' : ''}
            ${config.duration > 0 ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
        `;

        // Adiciona evento de fechar
        if (config.closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.remove(notification);
            });
        }

        // Adiciona evento de clique na notificação
        if (config.onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', config.onClick);
        }

        return notification;
    }

    /**
     * Remove uma notificação
     */
    remove(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // Remove do mapa
            for (const [id, notif] of this.notifications.entries()) {
                if (notif === notification) {
                    this.notifications.delete(id);
                    break;
                }
            }
        }, 400);
    }

    /**
     * Remove todas as notificações
     */
    clear() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    /**
     * Métodos de conveniência para diferentes tipos
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Obtém o título padrão baseado no tipo
     */
    getDefaultTitle(type) {
        const titles = {
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Atenção!',
            info: 'Informação'
        };
        return titles[type] || 'Notificação';
    }

    /**
     * Obtém o ícone padrão baseado no tipo
     */
    getDefaultIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-bell';
    }
}

// Cria uma instância global
const notifications = new NotificationSystem();

// Função global para compatibilidade com alert()
function showNotification(message, type = 'info', options = {}) {
    return notifications.show(message, type, options);
}

// Funções de conveniência globais
function showSuccess(message, options = {}) {
    return notifications.success(message, options);
}

function showError(message, options = {}) {
    return notifications.error(message, options);
}

function showWarning(message, options = {}) {
    return notifications.warning(message, options);
}

function showInfo(message, options = {}) {
    return notifications.info(message, options);
}

// Substitui o alert padrão (opcional)
function replaceAlert() {
    window.originalAlert = window.alert;
    window.alert = function(message) {
        showError(message, { title: 'Alerta' });
    };
}

// Restaura o alert padrão
function restoreAlert() {
    if (window.originalAlert) {
        window.alert = window.originalAlert;
    }
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.notifications = notifications;
    window.showNotification = showNotification;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
    window.replaceAlert = replaceAlert;
    window.restoreAlert = restoreAlert;
}

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notifications.init();
    });
} else {
    notifications.init();
}