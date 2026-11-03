import { create } from 'zustand';
import {
  InterviewConfig,
  InterviewSession,
  ChatMessage,
  Scorecard,
  VisionMetrics,
} from '../types/interview';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { AIService } from '../services/aiService';

interface InterviewState {
  // Navigation
  activeTab: 'dashboard' | 'setup' | 'interview' | 'report' | 'settings' | 'history';
  setActiveTab: (tab: InterviewState['activeTab']) => void;

  // Global Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Active Session
  currentSession: InterviewSession | null;
  startSession: (config: InterviewConfig) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (scorecard: Scorecard) => void;
  cancelSession: () => void;

  // Live Chat & Streaming
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastInterviewerMessage: (chunk: string) => void;
  isAIStreaming: boolean;
  setIsAIStreaming: (streaming: boolean) => void;

  // Audio / Speech State
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  interimTranscript: string;
  setInterimTranscript: (text: string) => void;
  detectedFillerWordsCount: number;
  addFillerWords: (count: number) => void;

  // Vision Telemetry
  latestVisionMetrics: VisionMetrics | null;
  eyeContactSamples: number[];
  confidenceSamples: number[];
  postureAlertActive: boolean;
  updateVisionMetrics: (metrics: VisionMetrics) => void;

  // Code Editor State
  codeSnippet: string;
  setCodeSnippet: (code: string) => void;
  selectedLanguage: 'javascript' | 'typescript' | 'python';
  setSelectedLanguage: (lang: 'javascript' | 'typescript' | 'python') => void;
  activeProblemId: string | null;
  setActiveProblemId: (id: string | null) => void;

  // Past Sessions & Scorecards
  sessionHistory: InterviewSession[];
  loadSession: (sessionId: string) => void;

  // AI Service instance
  aiService: AIService;
}

const SETTINGS_STORAGE_KEY = 'intervai_settings_v1';
const SESSIONS_STORAGE_KEY = 'intervai_sessions_v1';

const loadSavedSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const loadSavedSessions = (): InterviewSession[] => {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useInterviewStore = create<InterviewState>((set, get) => {
  const initialSettings = loadSavedSettings();
  const aiService = new AIService(initialSettings);

  return {
    activeTab: 'dashboard',
    setActiveTab: (tab) => set({ activeTab: tab }),

    settings: initialSettings,
    updateSettings: (newSettings) => {
      set((state) => {
        const merged = { ...state.settings, ...newSettings };
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        state.aiService.updateSettings(merged);
        return { settings: merged };
      });
    },

    currentSession: null,
    startSession: (config) => {
      const newSession: InterviewSession = {
        id: 'session-' + Date.now(),
        config,
        status: 'in_progress',
        startTime: Date.now(),
        messages: [],
      };

      set({
        currentSession: newSession,
        activeTab: 'interview',
        messages: [],
        eyeContactSamples: [],
        confidenceSamples: [],
        detectedFillerWordsCount: 0,
        interimTranscript: '',
        activeProblemId: config.dsaProblemId || (config.mode === 'coding' ? 'two-sum' : null),
      });
    },

    pauseSession: () => {
      set((state) => {
        if (!state.currentSession) return {};
        return {
          currentSession: { ...state.currentSession, status: 'paused' },
        };
      });
    },

    resumeSession: () => {
      set((state) => {
        if (!state.currentSession) return {};
        return {
          currentSession: { ...state.currentSession, status: 'in_progress' },
        };
      });
    },

    finishSession: (scorecard) => {
      const state = get();
      if (!state.currentSession) return;

      const completedSession: InterviewSession = {
        ...state.currentSession,
        status: 'completed',
        endTime: Date.now(),
        messages: state.messages,
        scorecard,
        codeSnippet: state.codeSnippet,
        language: state.selectedLanguage,
      };

      const updatedHistory = [completedSession, ...state.sessionHistory];
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch {}

      set({
        currentSession: completedSession,
        sessionHistory: updatedHistory,
        activeTab: 'report',
      });
    },

    cancelSession: () => {
      set({
        currentSession: null,
        activeTab: 'dashboard',
        messages: [],
      });
    },

    messages: [],
    addMessage: (msg) => {
      const newMessage: ChatMessage = {
        ...msg,
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
      };
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    },

    updateLastInterviewerMessage: (chunk) => {
      set((state) => {
        const msgs = [...state.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === 'interviewer') {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: msgs[lastIdx].content + chunk,
          };
          return { messages: msgs };
        } else {
          // If no interviewer message yet, create it
          msgs.push({
            id: 'msg-' + Date.now(),
            role: 'interviewer',
            content: chunk,
            timestamp: Date.now(),
          });
          return { messages: msgs };
        }
      });
    },

    isAIStreaming: false,
    setIsAIStreaming: (streaming) => set({ isAIStreaming: streaming }),

    isListening: false,
    setIsListening: (listening) => set({ isListening: listening }),

    isSpeaking: false,
    setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),

    interimTranscript: '',
    setInterimTranscript: (text) => set({ interimTranscript: text }),

    detectedFillerWordsCount: 0,
    addFillerWords: (count) =>
      set((state) => ({
        detectedFillerWordsCount: state.detectedFillerWordsCount + count,
      })),

    latestVisionMetrics: null,
    eyeContactSamples: [],
    confidenceSamples: [],
    postureAlertActive: false,
    updateVisionMetrics: (metrics) => {
      set((state) => ({
        latestVisionMetrics: metrics,
        eyeContactSamples: [...state.eyeContactSamples.slice(-50), metrics.eyeContactScore],
        confidenceSamples: [...state.confidenceSamples.slice(-50), metrics.confidenceScore],
        postureAlertActive: metrics.postureAlert,
      }));
    },

    codeSnippet: '',
    setCodeSnippet: (code) => set({ codeSnippet: code }),

    selectedLanguage: 'javascript',
    setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

    activeProblemId: null,
    setActiveProblemId: (id) => set({ activeProblemId: id }),

    sessionHistory: loadSavedSessions(),
    loadSession: (sessionId) => {
      const found = get().sessionHistory.find((s) => s.id === sessionId);
      if (found) {
        set({
          currentSession: found,
          messages: found.messages,
          activeTab: 'report',
        });
      }
    },

    aiService,
  };
});

