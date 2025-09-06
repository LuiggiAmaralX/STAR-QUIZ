/**
 * Sistema de Áudio
 * Gerencia sons de feedback e controles de volume
 */

class AudioManager {
    constructor() {
        this.sounds = {};

        this.audioContext = null;
        this.soundsLoaded = false;
        this.init();
    }

    init() {

        this.loadSounds();
        this.setupEventListeners();

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