import type { AIProvider } from './interview';

export interface AppSettings {
  // Provider settings
  activeProvider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
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

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'gemini',
  geminiApiKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
    '',
  geminiModel: 'gemini-1.5-flash',
  openaiApiKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_OPENAI_API_KEY || import.meta.env?.OPENAI_API_KEY)) ||
    '',
  openaiModel: 'gpt-4o-mini',
  groqApiKey:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.GROQ_API_KEY)) ||
    '',
  groqModel: 'llama-3.3-70b-versatile',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',

  enableLocalFallback: true,

  ttsVoiceName: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  autoSpeakResponse: true,
  handsFreeContinuousMode: true,

  webcamDeviceId: '',
  showTelemetryOverlay: true,
  eyeContactThreshold: 65,
  postureAlertSound: false,

  interviewerPersonality: 'balanced',
};
