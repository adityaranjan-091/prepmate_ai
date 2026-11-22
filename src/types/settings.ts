import type { AIProvider } from './interview';

export interface AppSettings {
  // Provider settings
  activeProvider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;

  // Fallback behavior
  enableLocalFallback: boolean;

  // Voice settings
  ttsVoiceName: string;
  ttsRate: number; // 0.8 to 1.5
  ttsPitch: number; // 0.8 to 1.2
  autoSpeakResponse: boolean;
  handsFreeContinuousMode: boolean;

  // Vision settings
  webcamDeviceId: string;
  showTelemetryOverlay: boolean;
  eyeContactThreshold: number; // e.g. 60%
  postureAlertSound: boolean;

  // Interviewer Persona
  interviewerPersonality: 'friendly' | 'balanced' | 'rigorous_faang' | 'stress_test';
}

export const DEFAULT_OLLAMA_MODEL = 'gemma3:4b';

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'ollama',
  geminiApiKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
    '',
  geminiModel: 'gemini-1.5-flash',
  groqApiKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY)) ||
    '',
  groqModel: 'llama-3.3-70b-versatile',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: DEFAULT_OLLAMA_MODEL,

  enableLocalFallback: true,

  ttsVoiceName: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  autoSpeakResponse: true,
  handsFreeContinuousMode: false,

  webcamDeviceId: '',
  showTelemetryOverlay: true,
  eyeContactThreshold: 65,
  postureAlertSound: false,

  interviewerPersonality: 'balanced',
};
