/**
 * Sistema de Áudio
 * Gerencia sons de feedback e controles de volume
 */

class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.7;
        this.muted = false;
        this.audioContext = null;
        this.soundsLoaded = false;
        this.init();
    }

    init() {
        this.createAudioControls();
        this.loadSounds();
        this.setupEventListeners();
        this.loadSettings();
    }

    /**
     * Cria os controles de áudio na interface
     */
    createAudioControls() {
        const controlsHTML = `
            <div class="audio-controls">
                <button class="audio-toggle" id="audioToggle" title="Ativar/Desativar Som">
                    <i class="fas fa-volume-up"></i>
                </button>
                <input type="range" class="volume-slider" id="volumeSlider" 
                       min="0" max="100" value="70" title="Volume">
            </div>

            <div class="muted-indicator" id="mutedIndicator">
                <i class="fas fa-volume-mute"></i> Som desativado
            </div>
        `;

        // Adiciona os controles ao body se não existirem
        if (!document.querySelector('.audio-controls')) {
            document.body.insertAdjacentHTML('beforeend', controlsHTML);
        }
    }

    /**
     * Carrega os sons usando Web Audio API ou fallback para HTML5 Audio
     */
    async loadSounds() {
        try {
            // Tenta inicializar Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API não suportada, usando HTML5 Audio');
        }

        // Define os sons com frequências diferentes para cada tipo
        const soundDefinitions = {
            success: { frequency: 800, duration: 0.3, type: 'sine' },
            error: { frequency: 300, duration: 0.5, type: 'sawtooth' },
            click: { frequency: 600, duration: 0.1, type: 'square' },
            notification: { frequency: 1000, duration: 0.2, type: 'sine' },
            countdown: { frequency: 400, duration: 0.8, type: 'triangle' },
            victory: { frequency: 1200, duration: 1.0, type: 'sine' },
            hover: { frequency: 500, duration: 0.05, type: 'sine' }
        };

        // Carrega cada som
        for (const [name, config] of Object.entries(soundDefinitions)) {
            this.sounds[name] = config;
        }

        this.soundsLoaded = true;
        console.log('Sistema de áudio carregado com sucesso');
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        const audioToggle = document.getElementById('audioToggle');
        const volumeSlider = document.getElementById('volumeSlider');

        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                this.toggleMute();
                this.playSound('click');
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });

            volumeSlider.addEventListener('change', () => {
                this.playSound('click');
            });
        }

        // Adiciona sons de hover aos elementos clicáveis
        this.addHoverSounds();
    }

    /**
     * Adiciona sons de hover aos elementos
     */
    addHoverSounds() {
        const clickableElements = document.querySelectorAll(
            'button, .btn, .category-card, .answer-button, a[href], input[type="submit"]'
        );

        clickableElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                if (!element.disabled) {
                    this.playSound('hover');
                }
            });

            element.addEventListener('click', () => {
                if (!element.disabled) {
                    this.playSound('click');
                }
            });

            element.classList.add('clickable-sound');
        });
    }

    /**
     * Reproduz um som
     * @param {string} soundName - Nome do som
     * @param {Object} options - Opções adicionais
     */
    playSound(soundName, options = {}) {
        if (!this.soundsLoaded || this.muted || !this.sounds[soundName]) {
            return;
        }

        try {
            if (this.audioContext) {
                this.playWebAudioSound(soundName, options);
            } else {
                this.playHTMLAudioSound(soundName, options);
            }

            // Feedback visual removido
        } catch (error) {
            console.warn('Erro ao reproduzir som:', error);
        }
    }

    /**
     * Reproduz som usando Web Audio API
     */
    playWebAudioSound(soundName, options = {}) {
        const sound = this.sounds[soundName];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
        oscillator.type = sound.type;

        const volume = (options.volume || this.volume) * 0.3; // Reduz volume base
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    }

    /**
     * Fallback para HTML5 Audio (sons mais simples)
     */
    playHTMLAudioSound(soundName, options = {}) {
        // Para navegadores que não suportam Web Audio API
        // Usa um beep simples com diferentes frequências
        const beep = (freq, duration) => {
            const audio = new Audio();
            const volume = (options.volume || this.volume) * 0.3;
            
            // Cria um data URL com um tom simples
            const sampleRate = 8000;
            const samples = Math.floor(sampleRate * duration);
            const buffer = new ArrayBuffer(44 + samples * 2);
            const view = new DataView(buffer);
            
            // WAV header
            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + samples * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, samples * 2, true);
            
            // Generate tone
            for (let i = 0; i < samples; i++) {
                const sample = Math.sin(2 * Math.PI * freq * i / sampleRate) * volume * 32767;
                view.setInt16(44 + i * 2, sample, true);
            }
            
            const blob = new Blob([buffer], { type: 'audio/wav' });
            audio.src = URL.createObjectURL(blob);
            audio.play().catch(() => {});
        };
        
        const sound = this.sounds[soundName];
        beep(sound.frequency, sound.duration);
    }

    /**
     * Mostra feedback visual do som
     */
    showSoundFeedback(soundName) {
        const feedback = document.getElementById('soundFeedback');
        if (!feedback) return;

        const icon = feedback.querySelector('i');
        
        // Remove classes anteriores
        feedback.className = 'sound-feedback';
        
        // Define ícone e classe baseado no tipo de som
        switch (soundName) {
            case 'success':
            case 'victory':
                icon.className = 'fas fa-check';
                feedback.classList.add('success');
                break;
            case 'error':
                icon.className = 'fas fa-times';
                feedback.classList.add('error');
                break;
            case 'click':
            case 'hover':
                icon.className = 'fas fa-mouse-pointer';
                feedback.classList.add('click');
                break;
            case 'notification':
                icon.className = 'fas fa-bell';
                feedback.classList.add('click');
                break;
            case 'countdown':
                icon.className = 'fas fa-clock';
                feedback.classList.add('click');
                break;
            default:
                icon.className = 'fas fa-volume-up';
                feedback.classList.add('click');
        }
        
        // Mostra o feedback
        feedback.classList.add('show');
        
        // Remove após a animação
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 600);
    }

    /**
     * Define o volume
     * @param {number} volume - Volume de 0 a 1
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }
    }

    /**
     * Alterna entre mudo e som
     */
    toggleMute() {
        this.muted = !this.muted;
        this.updateAudioToggle();
        this.showMutedIndicator();
        this.saveSettings();
    }

    /**
     * Atualiza o botão de áudio
     */
    updateAudioToggle() {
        const audioToggle = document.getElementById('audioToggle');
        if (!audioToggle) return;

        const icon = audioToggle.querySelector('i');
        if (this.muted) {
            icon.className = 'fas fa-volume-mute';
            audioToggle.classList.add('muted');
            audioToggle.title = 'Ativar Som';
        } else {
            icon.className = 'fas fa-volume-up';
            audioToggle.classList.remove('muted');
            audioToggle.title = 'Desativar Som';
        }
    }

    /**
     * Mostra indicador de som mutado
     */
    showMutedIndicator() {
        const indicator = document.getElementById('mutedIndicator');
        if (!indicator) return;

        if (this.muted) {
            indicator.classList.add('show');
        } else {
            indicator.classList.remove('show');
        }
    }

    /**
     * Salva configurações no localStorage
     */
    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            volume: this.volume,
            muted: this.muted
        }));
    }

    /**
     * Carrega configurações do localStorage
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
            
            if (settings.volume !== undefined) {
                this.setVolume(settings.volume);
            }
            
            if (settings.muted !== undefined) {
                this.muted = settings.muted;
                this.updateAudioToggle();
                this.showMutedIndicator();
            }
        } catch (error) {
            console.warn('Erro ao carregar configurações de áudio:', error);
        }
    }

    /**
     * Reproduz sequência de sons
     * @param {Array} sequence - Array de objetos {sound, delay}
     */
    async playSequence(sequence) {
        for (const { sound, delay = 0 } of sequence) {
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            this.playSound(sound);
        }
    }

    /**
     * Para todos os sons (se possível)
     */
    stopAllSounds() {
        if (this.audioContext) {
            try {
                this.audioContext.suspend();
                setTimeout(() => {
                    this.audioContext.resume();
                }, 100);
            } catch (error) {
                console.warn('Erro ao parar sons:', error);
            }
        }
    }

    /**
     * Reproduz som de contagem regressiva
     * @param {number} count - Número de contagens
     */
    async playCountdown(count = 3) {
        for (let i = count; i > 0; i--) {
            this.playSound('countdown');
            if (i > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        // Som final diferente
        setTimeout(() => {
            this.playSound('success');
        }, 1000);
    }
}

// Cria instância global
const audioManager = new AudioManager();

// Funções de conveniência globais
function playSound(soundName, options) {
    audioManager.playSound(soundName, options);
}

function toggleAudio() {
    audioManager.toggleMute();
}

function setVolume(volume) {
    audioManager.setVolume(volume);
}

function playSuccessSound() {
    audioManager.playSound('success');
}

function playErrorSound() {
    audioManager.playSound('error');
}

function playClickSound() {
    audioManager.playSound('click');
}

function playNotificationSound() {
    audioManager.playSound('notification');
}

function playVictorySound() {
    audioManager.playSound('victory');
}

function playCountdownSound(count) {
    audioManager.playCountdown(count);
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.audioManager = audioManager;
    window.playSound = playSound;
    window.toggleAudio = toggleAudio;
    window.setVolume = setVolume;
    window.playSuccessSound = playSuccessSound;
    window.playErrorSound = playErrorSound;
    window.playClickSound = playClickSound;
    window.playNotificationSound = playNotificationSound;
    window.playVictorySound = playVictorySound;
    window.playCountdownSound = playCountdownSound;
}

// Auto-inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        audioManager.init();
    });
} else {
    // Aguarda um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        audioManager.addHoverSounds();
    }, 500);
}