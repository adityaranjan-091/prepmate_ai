import { create } from 'zustand';
import {
  InterviewConfig,
  InterviewSession,
  ChatMessage,
  Scorecard,
  VisionMetrics,
} from '../types/interview';
import { AppSettings, DEFAULT_OLLAMA_MODEL, DEFAULT_SETTINGS } from '../types/settings';
import { AIService } from '../services/aiService';
import { activityDbService } from '../services/activityDbService';

interface InterviewState {
  // Navigation
  activeTab: 'dashboard' | 'setup' | 'interview' | 'report' | 'settings' | 'history' | 'core_cs' | 'profile';
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
  historyLoading: boolean;
  historyError: string | null;

  /**
   * Called by authStore after login to load sessions from Firestore.
   * Clears any previous user's sessions from memory first.
   */
  initSessionsForUser: (userId: string) => Promise<void>;

  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  clearAllHistory: () => void;

  // Current authenticated UID (set by authStore)
  currentUserId: string | null;
  setCurrentUserId: (uid: string | null) => void;

  // AI Service instance
  aiService: AIService;
}

const SETTINGS_STORAGE_KEY = 'prepmate_settings_v1';

const loadSavedSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem('intervai_settings_v1');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      activeProvider:
        parsed.ollamaModel?.trim() === 'llama3.2'
          ? 'ollama'
          : parsed.activeProvider === 'openai'
            ? 'gemini'
            : (parsed.activeProvider || DEFAULT_SETTINGS.activeProvider),
      geminiApiKey: parsed.geminiApiKey?.trim() || DEFAULT_SETTINGS.geminiApiKey,
      groqApiKey: parsed.groqApiKey?.trim() || DEFAULT_SETTINGS.groqApiKey,
      ollamaModel:
        parsed.ollamaModel?.trim() === 'llama3.2' || parsed.ollamaModel?.trim() === 'gemma4:e4b'
          ? DEFAULT_OLLAMA_MODEL
          : parsed.ollamaModel?.trim() || DEFAULT_OLLAMA_MODEL,
    };
  } catch {
    return DEFAULT_SETTINGS;
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
        const sanitized = { ...newSettings };
        if (typeof sanitized.geminiApiKey === 'string') sanitized.geminiApiKey = sanitized.geminiApiKey.trim();
        if (typeof sanitized.groqApiKey === 'string') sanitized.groqApiKey = sanitized.groqApiKey.trim();
        const merged = { ...state.settings, ...sanitized };
        // Always persist to localStorage as local fallback
        try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged)); } catch {}
        // Also sync to Firestore if user is authenticated
        const { currentUserId } = get();
        if (currentUserId) {
          activityDbService.saveSettings(currentUserId, merged).catch(() => {});
        }
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
        return { currentSession: { ...state.currentSession, status: 'paused' } };
      });
    },

    resumeSession: () => {
      set((state) => {
        if (!state.currentSession) return {};
        return { currentSession: { ...state.currentSession, status: 'in_progress' } };
      });
    },

    finishSession: (scorecard) => {
      const state = get();
      if (!state.currentSession || state.currentSession.status === 'completed') return;

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

      set({
        currentSession: completedSession,
        sessionHistory: updatedHistory,
        activeTab: 'report',
      });

      // Persist to Firestore (primary) if authenticated
      const { currentUserId } = get();
      if (currentUserId) {
        activityDbService.saveSession(currentUserId, completedSession).catch((err) => {
          console.warn('[InterviewStore] Failed to save session to Firestore:', err);
        });
      }
    },

    cancelSession: () => {
      set({
        currentSession: null,
        activeTab: 'dashboard',
        messages: [],
        isListening: false,
        isSpeaking: false,
        isAIStreaming: false,
        postureAlertActive: false,
      });
    },

    messages: [],
    addMessage: (msg) => {
      const newMessage: ChatMessage = {
        ...msg,
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, newMessage] }));
    },

    updateLastInterviewerMessage: (chunk) => {
      set((state) => {
        const msgs = [...state.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === 'interviewer') {
          msgs[lastIdx] = { ...msgs[lastIdx], content: msgs[lastIdx].content + chunk };
          return { messages: msgs };
        } else {
          msgs.push({ id: 'msg-' + Date.now(), role: 'interviewer', content: chunk, timestamp: Date.now() });
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
    addFillerWords: (count) => set((state) => ({ detectedFillerWordsCount: state.detectedFillerWordsCount + count })),

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

    // ── Session History (Firestore-backed) ────────────────────────────────────
    sessionHistory: [],
    historyLoading: false,
    historyError: null,

    currentUserId: null,
    setCurrentUserId: (uid) => set({ currentUserId: uid }),

    initSessionsForUser: async (userId: string) => {
      if (!userId) return;
      // Clear any previous user's sessions from memory immediately
      set({ sessionHistory: [], historyLoading: true, historyError: null, currentUserId: userId });

      try {
        // Ensure the user document root exists
        await activityDbService.ensureUserDoc(userId);

        // Load sessions from Firestore
        const result = await activityDbService.getSessions(userId);
        if (result.success && result.data) {
          set({ sessionHistory: result.data, historyLoading: false, historyError: null });
        } else {
          set({ sessionHistory: [], historyLoading: false, historyError: result.error || null });
        }

        // Load and merge persisted settings from Firestore (overrides localStorage stale values)
        const settingsResult = await activityDbService.getSettings(userId);
        if (settingsResult.success && settingsResult.data) {
          const merged = { ...get().settings, ...settingsResult.data };
          try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged)); } catch {}
          get().aiService.updateSettings(merged);
          set({ settings: merged });
        }
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? 'Failed to load session history.';
        set({ historyLoading: false, historyError: msg });
      }
    },

    loadSession: (sessionId) => {
      const found = get().sessionHistory.find((s) => s.id === sessionId);
      if (found) {
        set({ currentSession: found, messages: found.messages, activeTab: 'report' });
      }
    },

    deleteSession: (sessionId) => {
      const { currentUserId } = get();
      set((state) => ({
        sessionHistory: state.sessionHistory.filter((s) => s.id !== sessionId),
      }));
      if (currentUserId) {
        activityDbService.deleteSession(currentUserId, sessionId).catch((err) => {
          console.warn('[InterviewStore] Failed to delete session from Firestore:', err);
        });
      }
    },

    clearAllHistory: () => {
      const { currentUserId } = get();
      set({ sessionHistory: [] });
      if (currentUserId) {
        activityDbService.clearAllSessions(currentUserId).catch((err) => {
          console.warn('[InterviewStore] Failed to clear sessions from Firestore:', err);
        });
      }
    },

    aiService,
  };
});
