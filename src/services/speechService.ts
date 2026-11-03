export interface SpeechRecognitionCallbacks {
  onInterimResult: (text: string) => void;
  onFinalResult: (text: string, fillerWords: string[]) => void;
  onError: (error: string) => void;
  onStateChange: (isListening: boolean) => void;
}

export const COMMON_FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of', 'i mean', 'right'
];

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }

      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
          this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    if (this.synthesis) {
      this.availableVoices = this.synthesis.getVoices();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && this.synthesis) {
      this.availableVoices = this.synthesis.getVoices();
    }
    return this.availableVoices;
  }

  public isSTTSupported(): boolean {
    return !!this.recognition;
  }

  public isTTSSupported(): boolean {
    return !!this.synthesis;
  }

  /**
   * Starts live speech-to-text listening.
   */
  public startListening(callbacks: SpeechRecognitionCallbacks) {
    if (!this.recognition) {
      callbacks.onError('Speech Recognition is not supported in this environment.');
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    callbacks.onStateChange(true);

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        callbacks.onInterimResult(interim);
      }

      if (final) {
        const fillers = this.detectFillerWords(final);
        callbacks.onFinalResult(final.trim(), fillers);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        callbacks.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {}
      } else {
        callbacks.onStateChange(false);
      }
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      callbacks.onError(e.message);
    }
  }

  /**
   * Stops listening.
   */
  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  /**
   * Speaks out interviewer text using SpeechSynthesis.
   */
  public speak(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (!this.synthesis) return;

    // Clean any markup or code blocks from spoken text for natural voice output
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    const voices = this.getVoices();
    if (options.voiceName) {
      const selectedVoice = voices.find(v => v.name === options.voiceName);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else {
      // Pick a high-quality English voice if available
      const naturalVoice = voices.find(
        v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public detectFillerWords(text: string): string[] {
    const lower = text.toLowerCase();
    const detected: string[] = [];

    for (const filler of COMMON_FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          detected.push(filler);
        }
      }
    }
    return detected;
  }
}

export const speechService = new SpeechService();

