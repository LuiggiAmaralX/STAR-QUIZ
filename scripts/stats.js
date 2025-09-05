/**
 * Sistema de Estatísticas do Jogador para STAR QUIZ
 * Gerencia histórico, pontuações, conquistas e métricas
 */

class StatsManager {
    constructor() {
        this.playerStats = {
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 100,
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            gameHistory: [],
            achievements: [],
            categoriesPlayed: {},
            streaks: {
                current: 0,
                best: 0
            },
            timeStats: {
                totalPlayTime: 0,
                averageGameTime: 0,
                fastestGame: null,
                slowestGame: null
            }
        };
        
        this.achievements = [
            { id: 'first_game', name: 'Primeiro Jogo', description: 'Jogue sua primeira partida', icon: '🎮', unlocked: false },
            { id: 'perfect_score', name: 'Perfeição', description: 'Acerte todas as perguntas em um jogo', icon: '💯', unlocked: false },
            { id: 'speed_demon', name: 'Demônio da Velocidade', description: 'Complete um jogo em menos de 2 minutos', icon: '⚡', unlocked: false },
            { id: 'knowledge_seeker', name: 'Buscador do Conhecimento', description: 'Jogue em todas as categorias', icon: '📚', unlocked: false },
            { id: 'consistent_player', name: 'Jogador Consistente', description: 'Jogue 10 partidas', icon: '🎯', unlocked: false },
            { id: 'accuracy_master', name: 'Mestre da Precisão', description: 'Mantenha 80% de precisão em 5 jogos', icon: '🎪', unlocked: false },
            { id: 'streak_master', name: 'Mestre das Sequências', description: 'Acerte 10 perguntas seguidas', icon: '🔥', unlocked: false },
            { id: 'category_expert', name: 'Especialista', description: 'Jogue 5 vezes na mesma categoria', icon: '🏆', unlocked: false }
        ];
        
        this.init();
    }

    init() {
        this.loadStats();
        this.createStatsButton();
        this.createStatsModal();
        this.setupEventListeners();
    }

    // Carrega estatísticas do localStorage
    loadStats() {
        const savedStats = localStorage.getItem('starQuizStats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            this.playerStats = { ...this.playerStats, ...parsed };
        }
        
        const savedAchievements = localStorage.getItem('starQuizAchievements');
        if (savedAchievements) {
            const parsed = JSON.parse(savedAchievements);
            this.achievements = this.achievements.map(achievement => {
                const saved = parsed.find(a => a.id === achievement.id);
                return saved ? { ...achievement, unlocked: saved.unlocked } : achievement;
            });
        }
    }

    // Salva estatísticas no localStorage
    saveStats() {
        localStorage.setItem('starQuizStats', JSON.stringify(this.playerStats));
        localStorage.setItem('starQuizAchievements', JSON.stringify(this.achievements));
    }

    // Cria botão de estatísticas
    createStatsButton() {
        const button = document.createElement('button');
        button.className = 'stats-button';
        button.innerHTML = '<i class="fas fa-chart-bar"></i>';
        button.title = 'Ver Estatísticas';
        button.addEventListener('click', () => this.showStats());
        document.body.appendChild(button);
    }

    // Cria modal de estatísticas
    createStatsModal() {
        const modal = document.createElement('div');
        modal.className = 'stats-modal';
        modal.id = 'stats-modal';
        
        modal.innerHTML = `
            <div class="stats-content">
                <div class="stats-header">
                    <h2 class="stats-title"><i class="fas fa-trophy"></i> Suas Estatísticas</h2>
                    <button class="stats-close" onclick="statsManager.hideStats()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">
                        <i class="fas fa-chart-line"></i>
                        Estatísticas Gerais
                    </div>
                    <div class="stats-grid" id="general-stats">
                        <!-- Estatísticas gerais serão inseridas aqui -->
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">
                        <i class="fas fa-target"></i>
                        Progresso
                    </div>
                    <div class="progress-section" id="progress-stats">
                        <!-- Barras de progresso serão inseridas aqui -->
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">
                        <i class="fas fa-medal"></i>
                        Conquistas
                    </div>
                    <div class="achievements-grid" id="achievements-grid">
                        <!-- Conquistas serão inseridas aqui -->
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="stats-section-title">
                        <i class="fas fa-history"></i>
                        Histórico de Jogos
                    </div>
                    <div class="history-list" id="game-history">
                        <!-- Histórico será inserido aqui -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fecha modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideStats();
            }
        });
    }

    // Configura event listeners
    setupEventListeners() {
        // Escuta eventos de fim de jogo
        document.addEventListener('gameFinished', (e) => {
            this.recordGame(e.detail);
        });
        
        // Escuta eventos de resposta
        document.addEventListener('answerSelected', (e) => {
            this.recordAnswer(e.detail);
        });
    }

    // Registra um jogo completo
    recordGame(gameData) {
        const {
            score,
            totalQuestions,
            category,
            duration,
            correctAnswers,
            date = new Date().toISOString()
        } = gameData;
        
        // Atualiza estatísticas gerais
        this.playerStats.gamesPlayed++;
        this.playerStats.totalScore += score;
        this.playerStats.totalQuestions += totalQuestions;
        this.playerStats.correctAnswers += correctAnswers;
        
        // Calcula médias
        this.playerStats.averageScore = Math.round(this.playerStats.totalScore / this.playerStats.gamesPlayed);
        this.playerStats.accuracy = Math.round((this.playerStats.correctAnswers / this.playerStats.totalQuestions) * 100);
        
        // Atualiza recordes
        if (score > this.playerStats.bestScore) {
            this.playerStats.bestScore = score;
        }
        if (score < this.playerStats.worstScore || this.playerStats.worstScore === 100) {
            this.playerStats.worstScore = score;
        }
        
        // Atualiza estatísticas de tempo
        this.playerStats.timeStats.totalPlayTime += duration;
        this.playerStats.timeStats.averageGameTime = Math.round(this.playerStats.timeStats.totalPlayTime / this.playerStats.gamesPlayed);
        
        if (!this.playerStats.timeStats.fastestGame || duration < this.playerStats.timeStats.fastestGame) {
            this.playerStats.timeStats.fastestGame = duration;
        }
        if (!this.playerStats.timeStats.slowestGame || duration > this.playerStats.timeStats.slowestGame) {
            this.playerStats.timeStats.slowestGame = duration;
        }
        
        // Atualiza categorias jogadas
        if (!this.playerStats.categoriesPlayed[category]) {
            this.playerStats.categoriesPlayed[category] = 0;
        }
        this.playerStats.categoriesPlayed[category]++;
        
        // Adiciona ao histórico
        this.playerStats.gameHistory.unshift({
            date,
            score,
            totalQuestions,
            category,
            duration,
            accuracy: Math.round((correctAnswers / totalQuestions) * 100)
        });
        
        // Mantém apenas os últimos 20 jogos
        if (this.playerStats.gameHistory.length > 20) {
            this.playerStats.gameHistory = this.playerStats.gameHistory.slice(0, 20);
        }
        
        // Verifica conquistas
        this.checkAchievements(gameData);
        
        // Salva estatísticas
        this.saveStats();
    }

    // Registra uma resposta
    recordAnswer(answerData) {
        const { isCorrect } = answerData;
        
        if (isCorrect) {
            this.playerStats.streaks.current++;
            if (this.playerStats.streaks.current > this.playerStats.streaks.best) {
                this.playerStats.streaks.best = this.playerStats.streaks.current;
            }
        } else {
            this.playerStats.streaks.current = 0;
        }
    }

    // Verifica e desbloqueia conquistas
    checkAchievements(gameData) {
        const { score, totalQuestions, category, duration, correctAnswers } = gameData;
        const accuracy = (correctAnswers / totalQuestions) * 100;
        
        // Primeiro jogo
        this.unlockAchievement('first_game');
        
        // Pontuação perfeita
        if (score === totalQuestions) {
            this.unlockAchievement('perfect_score');
        }
        
        // Jogo rápido (menos de 2 minutos)
        if (duration < 120000) {
            this.unlockAchievement('speed_demon');
        }
        
        // Jogador consistente (10 jogos)
        if (this.playerStats.gamesPlayed >= 10) {
            this.unlockAchievement('consistent_player');
        }
        
        // Mestre da precisão (80% de precisão geral)
        if (this.playerStats.accuracy >= 80 && this.playerStats.gamesPlayed >= 5) {
            this.unlockAchievement('accuracy_master');
        }
        
        // Mestre das sequências (10 acertos seguidos)
        if (this.playerStats.streaks.best >= 10) {
            this.unlockAchievement('streak_master');
        }
        
        // Buscador do conhecimento (todas as categorias)
        const totalCategories = Object.keys(this.playerStats.categoriesPlayed).length;
        if (totalCategories >= 5) { // Assumindo 5 categorias disponíveis
            this.unlockAchievement('knowledge_seeker');
        }
        
        // Especialista em categoria (5 jogos na mesma categoria)
        if (this.playerStats.categoriesPlayed[category] >= 5) {
            this.unlockAchievement('category_expert');
        }
    }

    // Desbloqueia uma conquista
    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievementNotification(achievement);
        }
    }

    // Mostra notificação de conquista desbloqueada
    showAchievementNotification(achievement) {
        if (typeof window.showSuccess === 'function') {
            window.showSuccess(
                `Conquista Desbloqueada: ${achievement.name}!`,
                `${achievement.icon} ${achievement.description}`
            );
        }
    }

    // Mostra modal de estatísticas
    showStats() {
        this.updateStatsDisplay();
        const modal = document.getElementById('stats-modal');
        modal.classList.add('active');
        
        // Reproduz som se disponível
        if (typeof window.playSound === 'function') {
            window.playSound('click');
        }
    }

    // Esconde modal de estatísticas
    hideStats() {
        const modal = document.getElementById('stats-modal');
        modal.classList.remove('active');
    }

    // Atualiza exibição das estatísticas
    updateStatsDisplay() {
        this.updateGeneralStats();
        this.updateProgressStats();
        this.updateAchievements();
        this.updateGameHistory();
    }

    // Atualiza estatísticas gerais
    updateGeneralStats() {
        const container = document.getElementById('general-stats');
        const stats = [
            { label: 'Jogos', value: this.playerStats.gamesPlayed, icon: '🎮' },
            { label: 'Pontuação Média', value: this.playerStats.averageScore, icon: '📊' },
            { label: 'Melhor Pontuação', value: this.playerStats.bestScore, icon: '🏆' },
            { label: 'Precisão', value: `${this.playerStats.accuracy}%`, icon: '🎯' },
            { label: 'Sequência Atual', value: this.playerStats.streaks.current, icon: '🔥' },
            { label: 'Melhor Sequência', value: this.playerStats.streaks.best, icon: '⚡' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <span class="stat-value">${stat.value}</span>
                <span class="stat-label">${stat.icon} ${stat.label}</span>
            </div>
        `).join('');
        
        // Anima os valores
        setTimeout(() => {
            container.querySelectorAll('.stat-value').forEach(el => {
                el.classList.add('animate');
            });
        }, 100);
    }

    // Atualiza barras de progresso
    updateProgressStats() {
        const container = document.getElementById('progress-stats');
        const progressItems = [
            {
                label: 'Precisão Geral',
                value: this.playerStats.accuracy,
                max: 100,
                color: '#4CAF50'
            },
            {
                label: 'Jogos para Próxima Conquista',
                value: Math.min(this.playerStats.gamesPlayed, 10),
                max: 10,
                color: '#2196F3'
            },
            {
                label: 'Categorias Exploradas',
                value: Object.keys(this.playerStats.categoriesPlayed).length,
                max: 5,
                color: '#FF9800'
            }
        ];
        
        container.innerHTML = progressItems.map(item => `
            <div class="progress-item">
                <div class="progress-label">
                    <span>${item.label}</span>
                    <span>${item.value}/${item.max}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(item.value / item.max) * 100}%; background-color: ${item.color};"></div>
                </div>
            </div>
        `).join('');
    }

    // Atualiza conquistas
    updateAchievements() {
        const container = document.getElementById('achievements-grid');
        
        container.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-icon">${achievement.icon}</span>
                <span class="achievement-name">${achievement.name}</span>
                <div class="achievement-tooltip">${achievement.description}</div>
            </div>
        `).join('');
    }

    // Atualiza histórico de jogos
    updateGameHistory() {
        const container = document.getElementById('game-history');
        
        if (this.playerStats.gameHistory.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 20px;">Nenhum jogo registrado ainda</p>';
            return;
        }
        
        container.innerHTML = this.playerStats.gameHistory.map(game => {
            const date = new Date(game.date).toLocaleDateString('pt-BR');
            const time = new Date(game.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="history-item">
                    <div>
                        <div class="history-category">${game.category}</div>
                        <div class="history-date">${date} às ${time}</div>
                    </div>
                    <div>
                        <div class="history-score">${game.score}/${game.totalQuestions}</div>
                        <div class="history-date">${game.accuracy}% precisão</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Reseta todas as estatísticas
    resetStats() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('starQuizStats');
            localStorage.removeItem('starQuizAchievements');
            location.reload();
        }
    }

    // Exporta estatísticas
    exportStats() {
        const data = {
            stats: this.playerStats,
            achievements: this.achievements,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `star-quiz-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Instância global do gerenciador de estatísticas
const statsManager = new StatsManager();

// Funções de conveniência para uso global
window.recordGame = (gameData) => statsManager.recordGame(gameData);
window.recordAnswer = (answerData) => statsManager.recordAnswer(answerData);
window.showStats = () => statsManager.showStats();
window.statsManager = statsManager;

// Adiciona atalho de teclado para abrir estatísticas
document.addEventListener('keydown', (e) => {
    if (e.key === 'S' && e.ctrlKey) {
        e.preventDefault();
        statsManager.showStats();
    }
});