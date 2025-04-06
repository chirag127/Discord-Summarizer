/**
 * Text-to-Speech module for Discord Summarizer
 * Provides functionality for reading text with word-by-word highlighting
 */

// TTS Controller class
class TTSController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.currentWord = 0;
        this.words = [];
        this.highlightedElements = [];
        this.contentElement = null;
        this.originalContent = '';
        this.settings = {
            rate: 1.0,
            pitch: 1.0,
            voice: null
        };
        this.onFinishCallback = null;
    }

    /**
     * Initialize TTS with user settings
     * @param {Object} settings - User settings for TTS
     */
    async init(settings = {}) {
        // Wait for voices to be loaded
        if (speechSynthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                speechSynthesis.onvoiceschanged = resolve;
            });
        }

        // Apply settings
        this.settings = {
            ...this.settings,
            ...settings
        };

        // Set voice if specified by name
        if (settings.voiceName) {
            const voices = this.synth.getVoices();
            const voice = voices.find(v => v.name === settings.voiceName);
            if (voice) {
                this.settings.voice = voice;
            }
        }

        return this;
    }

    /**
     * Get available voices
     * @returns {Array} Array of available voices
     */
    getVoices() {
        return this.synth.getVoices();
    }

    /**
     * Prepare text for speech with word highlighting
     * @param {string} text - Text to be spoken
     * @param {HTMLElement} element - Element containing the text to highlight
     * @param {Function} onFinish - Callback function when speech is finished
     */
    prepare(text, element, onFinish = null) {
        // Cancel any ongoing speech
        this.cancel();
        
        this.contentElement = element;
        this.originalContent = element.innerHTML;
        this.onFinishCallback = onFinish;
        
        // Clean text and split into words
        const cleanText = text.replace(/\\n/g, ' ').trim();
        this.words = cleanText.split(/\s+/);
        
        // Create utterance
        this.utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance.rate = this.settings.rate;
        this.utterance.pitch = this.settings.pitch;
        
        if (this.settings.voice) {
            this.utterance.voice = this.settings.voice;
        }
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Prepare the content for highlighting
        this.prepareContentForHighlighting();
        
        return this;
    }

    /**
     * Set up event handlers for speech events
     */
    setupEventHandlers() {
        // Word boundary event for highlighting
        this.utterance.onboundary = (event) => {
            if (event.name === 'word') {
                this.currentWord = this.getWordIndex(event.charIndex);
                this.highlightCurrentWord();
            }
        };

        // Handle speech end
        this.utterance.onend = () => {
            this.isPlaying = false;
            this.resetHighlighting();
            
            if (this.onFinishCallback) {
                this.onFinishCallback();
            }
        };

        // Handle speech errors
        this.utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isPlaying = false;
            this.resetHighlighting();
        };
    }

    /**
     * Get the word index based on character index
     * @param {number} charIndex - Character index in the text
     * @returns {number} Word index
     */
    getWordIndex(charIndex) {
        let text = this.utterance.text.substring(0, charIndex);
        return text.split(/\s+/).length - 1;
    }

    /**
     * Prepare content for word-by-word highlighting
     */
    prepareContentForHighlighting() {
        if (!this.contentElement) return;
        
        // Create spans for each word
        const wordElements = this.words.map((word, index) => 
            `<span class="tts-word" data-word-index="${index}">${word}</span>`
        );
        
        // Replace content with spans
        this.contentElement.innerHTML = wordElements.join(' ');
        
        // Store references to all word elements
        this.highlightedElements = Array.from(
            this.contentElement.querySelectorAll('.tts-word')
        );
    }

    /**
     * Highlight the current word being spoken
     */
    highlightCurrentWord() {
        // Remove previous highlighting
        this.highlightedElements.forEach(el => {
            el.classList.remove('tts-highlight');
        });
        
        // Add highlighting to current word
        const currentElement = this.highlightedElements[this.currentWord];
        if (currentElement) {
            currentElement.classList.add('tts-highlight');
            
            // Scroll to the highlighted word if needed
            currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Start or resume speech
     */
    play() {
        if (this.isPlaying) return;
        
        if (!this.utterance) {
            console.error('No text prepared for speech');
            return;
        }
        
        this.synth.speak(this.utterance);
        this.isPlaying = true;
        
        // Highlight first word immediately
        setTimeout(() => {
            this.highlightCurrentWord();
        }, 100);
        
        return this;
    }

    /**
     * Pause speech
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.synth.pause();
        this.isPlaying = false;
        
        return this;
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.isPlaying) return;
        
        this.synth.resume();
        this.isPlaying = true;
        
        return this;
    }

    /**
     * Toggle between play and pause
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.synth.paused) {
                this.resume();
            } else {
                this.play();
            }
        }
        
        return this;
    }

    /**
     * Cancel speech and reset
     */
    cancel() {
        this.synth.cancel();
        this.isPlaying = false;
        this.resetHighlighting();
        
        return this;
    }

    /**
     * Reset content highlighting
     */
    resetHighlighting() {
        if (this.contentElement && this.originalContent) {
            this.contentElement.innerHTML = this.originalContent;
            this.highlightedElements = [];
        }
    }

    /**
     * Update TTS settings
     * @param {Object} settings - New settings to apply
     */
    updateSettings(settings) {
        this.settings = {
            ...this.settings,
            ...settings
        };
        
        // If there's an active utterance, update its properties
        if (this.utterance) {
            this.utterance.rate = this.settings.rate;
            this.utterance.pitch = this.settings.pitch;
            
            if (settings.voice) {
                this.utterance.voice = settings.voice;
            }
        }
        
        return this;
    }
}

// Create and export a singleton instance
const ttsController = new TTSController();

// Export the controller
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ttsController;
} else {
    window.ttsController = ttsController;
}
