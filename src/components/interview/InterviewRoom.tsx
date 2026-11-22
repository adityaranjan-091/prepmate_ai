import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Square,
  Volume2,
  VolumeX,
  Code,
  Users,
  Layers,
  MessageSquare,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Columns,
  Maximize2,
  PanelTopClose,
  PanelTopOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { AIInterviewerAvatar } from './AIInterviewerAvatar';
import { WebcamMonitor } from './WebcamMonitor';
import { CodingWorkspace } from './CodingWorkspace';
import { BehavioralHelper } from './BehavioralHelper';
import { SystemDesignWorkspace } from './SystemDesignWorkspace';
import { speechService } from '../../services/speechService';
import { ChatMessage } from '../../types/interview';
import { LiveMeetingStage } from './LiveMeetingStage';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';

type LayoutMode = 'split' | 'workspace' | 'dialogue';
type WorkspaceMode = 'coding' | 'behavioral' | 'system_design';

export const InterviewRoom: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const {
    currentSession,
    messages,
    addMessage,
    updateLastInterviewerMessage,
    isAIStreaming,
    setIsAIStreaming,
    isListening,
    setIsListening,
    isSpeaking,
    setIsSpeaking,
    interimTranscript,
    setInterimTranscript,
    addFillerWords,
    codeSnippet,
    finishSession,
    cancelSession,
    settings,
    aiService,
  } = useInterviewStore();

  const [typedMessage, setTypedMessage] = useState('');
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<WorkspaceMode | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dialogue');
  const [compactVideo, setCompactVideo] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Cleanup speech synthesis and recognition when unmounting
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // Scroll transcript to bottom on new messages
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Dismiss finish confirmation modal with Escape when not submitting
  useEffect(() => {
    if (!showFinishConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFinishing) {
        setShowFinishConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFinishConfirm, isFinishing]);

  const playVoiceResponse = useCallback(
    (text: string) => {
      if (isMutedRef.current) return;
      setIsSpeaking(true);
      speechService.speak(text, {
        voiceName: settings.ttsVoiceName || undefined,
        rate: settings.ttsRate,
        pitch: settings.ttsPitch,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    },
    [settings.ttsVoiceName, settings.ttsRate, settings.ttsPitch, setIsSpeaking]
  );

  const streamInterviewerTurn = useCallback(
    async (
      history: ChatMessage[],
      codeContext: string,
      fallbackErrorHint: string
    ) => {
      if (!currentSession) return;
      setIsAIStreaming(true);

      let accumulatedText = '';
      try {
        await aiService.generateInterviewerResponse(
          currentSession.config,
          history,
          codeContext,
          {
            onChunk: (chunk) => {
              accumulatedText += chunk;
              updateLastInterviewerMessage(chunk);
              setAiErrorMessage(null);
            },
            onComplete: (full) => {
              setIsAIStreaming(false);
              setAiErrorMessage(null);
              if (settings.autoSpeakResponse && !isMutedRef.current) {
                playVoiceResponse(full);
              }
            },
            onError: (err) => {
              setIsAIStreaming(false);
              setAiErrorMessage(err.message);
              console.error('Interviewer response error:', err);
              if (!accumulatedText) {
                updateLastInterviewerMessage(
                  `⚠️ [AI Notice: ${err.message}] ${fallbackErrorHint}`
                );
              }
            },
          }
        );
      } catch (err) {
        setIsAIStreaming(false);
        const message =
          err instanceof Error ? err.message : 'Unexpected AI streaming error';
        setAiErrorMessage(message);
        if (!accumulatedText) {
          updateLastInterviewerMessage(
            `⚠️ [AI Notice: ${message}] ${fallbackErrorHint}`
          );
        }
      }
    },
    [
      currentSession,
      aiService,
      setIsAIStreaming,
      updateLastInterviewerMessage,
      settings.autoSpeakResponse,
      playVoiceResponse,
    ]
  );

  // Kick off the interview with the first interviewer opening question (StrictMode-safe)
  useEffect(() => {
    if (!currentSession || messages.length > 0 || hasGreetedRef.current) return;
    hasGreetedRef.current = true;
    const candidateName =
      profile.fullName.trim() || user?.displayName?.trim() || 'the candidate';

    const greetingPrompt: ChatMessage = {
      id: 'system-init',
      role: 'candidate',
      content: `Hello, I am ${candidateName}. I am ready for the ${currentSession.config.targetRole} interview at ${currentSession.config.targetCompany}. Please introduce yourself naturally and begin with one opening question.`,
      timestamp: Date.now(),
    };

    void streamInterviewerTurn(
      [greetingPrompt],
      '',
      'You can verify your API key in Settings.'
    );
  }, [
    currentSession,
    messages.length,
    streamInterviewerTurn,
    profile.fullName,
    user?.displayName,
  ]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        speechService.stopSpeaking();
        setIsSpeaking(false);
      }
      return next;
    });
  };

  const stopVoiceRecognition = useCallback(() => {
    speechService.stopListening();
    setIsListening(false);
  }, [setIsListening]);

  const handleCandidateReply = async (text: string) => {
    if (!text.trim() || !currentSession || isAIStreaming) return;

    speechService.stopSpeaking();
    setIsSpeaking(false);

    const trimmed = text.trim();
    addMessage({
      role: 'candidate',
      content: trimmed,
    });

    setTypedMessage('');

    const updatedHistory: ChatMessage[] = [
      ...messages,
      {
        id: `candidate-${Date.now()}`,
        role: 'candidate',
        content: trimmed,
        timestamp: Date.now(),
      },
    ];

    await streamInterviewerTurn(
      updatedHistory,
      codeSnippet,
      'Check Settings if your key quota was exceeded.'
    );
  };

  const startVoiceRecognition = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
    stopVoiceRecognition();

    speechService.startListening({
      onInterimResult: (text) => {
        setInterimTranscript(text);
      },
      onFinalResult: (text, fillerWords) => {
        setInterimTranscript('');
        if (fillerWords.length > 0) {
          addFillerWords(fillerWords.length);
        }
        if (text.trim()) {
          stopVoiceRecognition();
          void handleCandidateReply(text);
        }
      },
      onError: (err) => {
        console.warn('Speech error:', err);
      },
      onStateChange: (listening) => {
        setIsListening(listening);
      },
    });
  };

  const handleConfirmFinish = async () => {
    if (!currentSession || isFinishing) return;
    setIsFinishing(true);
    setFinishError(null);
    speechService.stopSpeaking();
    speechService.stopListening();
    setIsSpeaking(false);
    setIsListening(false);

    try {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('AI evaluation timed out after 15 seconds')),
          15000
        );
      });

      const scorecard = await Promise.race([
        aiService.generateEvaluationReport(currentSession.config, messages, codeSnippet),
        timeoutPromise,
      ]);
      if (timeoutId) clearTimeout(timeoutId);

      setShowFinishConfirm(false);
      finishSession(scorecard);
    } catch (err) {
      console.error('Error generating scorecard:', err);
      setFinishError(
        err instanceof Error
          ? `AI evaluation failed: ${err.message}`
          : 'AI evaluation failed. Check your provider settings and try again.'
      );
    } finally {
      setIsFinishing(false);
    }
  };

  const workspaceTabs = [
    { id: 'coding' as const, label: 'Code Sandbox', Icon: Code },
    { id: 'system_design' as const, label: 'System Design', Icon: Layers },
    { id: 'behavioral' as const, label: 'STAR Guide', Icon: Users },
  ];

  const status = isAIStreaming
    ? {
      label: 'Thinking',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/30',
      pulse: true,
    }
    : isSpeaking
      ? {
        label: 'Speaking',
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        pulse: true,
      }
      : isListening
        ? {
          label: 'Listening',
          dot: 'bg-red-400',
          text: 'text-red-300',
          bg: 'bg-red-500/10 border-red-500/30',
          pulse: true,
        }
        : {
          label: 'Ready',
          dot: 'bg-gray-500',
          text: 'text-gray-400',
          bg: 'bg-gray-800/60 border-gray-700',
          pulse: false,
        };

  const quickPrompts = [
    {
      label: 'Ask for a hint',
      prompt: 'Could you give me a slight Socratic hint for this approach?',
    },
    {
      label: 'Clarify requirements',
      prompt:
        'Before writing the code, can I clarify edge cases and input constraints?',
    },
    {
      label: 'Discuss complexity',
      prompt: "I'd like to discuss the time and space complexity trade-offs.",
    },
    {
      label: 'Repeat question',
      prompt: 'Could you please rephrase or repeat the last question?',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden px-4 py-3.5 lg:px-5 lg:py-4 gap-3.5 bg-gray-950">
      {/* ───────────── Studio Control Navigation Bar ───────────── */}
      <header className="shrink-0 flex items-center justify-between gap-4 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/20 select-none">
        {/* Left: Role info & Status badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-white truncate tracking-tight">
              {currentSession?.config.targetRole}
              <span className="text-gray-500 font-normal"> @ </span>
              {currentSession?.config.targetCompany}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase shrink-0">
              {currentSession?.config.candidateLevel}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-800 hidden sm:block shrink-0" />

          {/* Live AI Status */}
          <div
            aria-live="polite"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium shrink-0 ${status.bg} ${status.text}`}
          >
            <span className="relative flex w-2 h-2">
              {status.pulse && (
                <span
                  className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${status.dot}`}
                />
              )}
              <span
                className={`relative inline-flex w-2 h-2 rounded-full ${status.dot}`}
              />
            </span>
            <span>{status.label}</span>
          </div>
        </div>

        {/* Center: Section Selector */}
        <div
          role="tablist"
          aria-label="Interview workspace mode"
          className="flex items-center gap-1 bg-gray-950/90 p-1 rounded-xl border border-gray-800"
        >
          {workspaceTabs.map(({ id, label, Icon }) => {
            const isActive = activeWorkspaceMode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  if (activeWorkspaceMode === id && layoutMode !== 'dialogue') {
                    setActiveWorkspaceMode(null);
                    setLayoutMode('dialogue');
                    return;
                  }
                  setActiveWorkspaceMode(id);
                  setLayoutMode('split');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Layout Switcher & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-gray-950/90 p-0.5 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              aria-label="Split view layout"
              aria-pressed={layoutMode === 'split'}
              title="Split View (Dialogue & Workspace)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${layoutMode === 'split'
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('workspace')}
              aria-label="Focus workspace layout"
              aria-pressed={layoutMode === 'workspace'}
              title="Focus Workspace (Maximized editor / whiteboard)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${layoutMode === 'workspace'
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('dialogue')}
              aria-label="Focus dialogue layout"
              aria-pressed={layoutMode === 'dialogue'}
              title="Focus Dialogue (Interview Conversation Stage)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${layoutMode === 'dialogue'
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video Dock Compact Toggle */}
          <button
            type="button"
            onClick={() => setCompactVideo((prev) => !prev)}
            aria-label={compactVideo ? 'Expand video stage' : 'Collapse video stage'}
            aria-pressed={compactVideo}
            title={
              compactVideo
                ? 'Expand video stage'
                : 'Dock video into compact bar'
            }
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 transition cursor-pointer"
          >
            {compactVideo ? (
              <PanelTopOpen className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <PanelTopClose className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-gray-800 hidden sm:block" />

          {/* End Interview Trigger */}
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold transition shadow-sm shadow-red-600/20 active:scale-95 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* ───────────── Main Workspace Area ───────────── */}
      <div className="flex-1 grid grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        {/* ── Section A: Live Dialogue Stage ── */}
        <section
          className={`flex flex-col gap-3 min-h-0 transition-all duration-300 ${layoutMode === 'dialogue'
              ? 'col-span-12 max-w-4xl mx-auto w-full'
              : layoutMode === 'workspace'
                ? 'hidden'
                : 'col-span-12 lg:col-span-6 xl:col-span-7'
            }`}
        >
          {/* Top Video Stage / Compact Dock */}
          <div className="shrink-0">
            {currentSession?.config.meetingType &&
              currentSession.config.meetingType !== 'ai' &&
              currentSession.config.roomCode ? (
              <LiveMeetingStage
                roomCode={currentSession.config.roomCode}
                compact={compactVideo}
                onLeave={() => setShowFinishConfirm(true)}
              />
            ) : compactVideo ? (
              <div className="grid grid-cols-2 gap-2.5">
                <AIInterviewerAvatar
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  isAIStreaming={isAIStreaming}
                  companyName={currentSession?.config.targetCompany || 'Tech'}
                  compact
                />
                <WebcamMonitor
                  enabled={currentSession?.config.videoEnabled ?? true}
                  compact
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <AIInterviewerAvatar
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  isAIStreaming={isAIStreaming}
                  companyName={currentSession?.config.targetCompany || 'Tech'}
                />
                <WebcamMonitor
                  enabled={currentSession?.config.videoEnabled ?? true}
                />
              </div>
            )}
          </div>

          {/* Conversation Transcript Stage */}
          <div className="flex-1 rounded-2xl bg-gray-900/40 border border-gray-800 flex flex-col overflow-hidden shadow-xl min-h-0">
            {/* Card header with exchanges count */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-800/90 bg-gray-900/70 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                <span className="grid place-items-center w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                </span>
                <span>Live Dialogue &amp; Notes</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-gray-950/80 border border-gray-800">
                {messages.length}{' '}
                {messages.length === 1 ? 'exchange' : 'exchanges'}
              </span>
            </div>

            {/* AI Warning Banner */}
            {aiErrorMessage && (
              <div
                role="alert"
                className="shrink-0 mx-3.5 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    {aiErrorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiErrorMessage(null)}
                  aria-label="Dismiss warning"
                  className="text-amber-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Scrollable messages stream */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 text-xs scroll-smooth select-text bg-gray-950/60 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {messages.length === 0 && !isAIStreaming && !interimTranscript && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2.5 text-gray-500 py-8 select-none">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gray-900 border border-gray-800">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-300">
                      Interview stage is ready
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                      Your conversation with the AI interviewer will appear
                      here. Speak or type below.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isCandidate = msg.role === 'candidate';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isCandidate ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`grid place-items-center w-6 h-6 shrink-0 rounded-full border text-[11px] select-none ${isCandidate
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                          : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}
                    >
                      {isCandidate ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>

                    <div
                      className={`flex flex-col max-w-[85%] ${isCandidate ? 'items-end' : 'items-start'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500 select-none">
                        <span className="font-semibold text-gray-300">
                          {isCandidate
                            ? 'You'
                            : `${currentSession?.config.targetCompany || 'AI'} Interviewer`}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap break-words shadow-sm text-xs ${isCandidate
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-900/95 text-gray-200 border border-gray-800 rounded-bl-sm'
                          }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAIStreaming &&
                (messages.length === 0 ||
                  messages[messages.length - 1]?.role === 'candidate') && (
                  <div className="flex items-end gap-2.5">
                    <div className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-gray-900 border border-gray-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                    </div>
                  </div>
                )}

              {/* Interim voice transcript indicator */}
              {interimTranscript && (
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-[10px] text-blue-400 select-none">
                    <Mic className="w-3 h-3 animate-pulse" />
                    Transcribing speech...
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs italic animate-pulse">
                    “{interimTranscript}…”
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Socratic Prompt Chips */}
            <div className="shrink-0 px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-gray-800/80 bg-gray-950/90 select-none">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  onClick={() => void handleCandidateReply(qp.prompt)}
                  disabled={isAIStreaming}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-[11px] font-medium text-gray-300 hover:text-white whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Composer */}
            <div className="shrink-0 p-3 border-t border-gray-800 bg-gray-900/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) stopVoiceRecognition();
                    else startVoiceRecognition();
                  }}
                  disabled={isAIStreaming}
                  aria-label={
                    isListening ? 'Stop voice recording' : 'Start voice recording'
                  }
                  aria-pressed={isListening}
                  className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95'
                    }`}
                  title={
                    isListening ? 'Stop recording' : 'Speak to interviewer'
                  }
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                  aria-pressed={isMuted}
                  className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl border transition cursor-pointer ${isMuted
                      ? 'bg-gray-950 text-gray-500 border-gray-800'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                    }`}
                  title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleCandidateReply(typedMessage);
                    }
                  }}
                  aria-label="Message to interviewer"
                  placeholder={
                    isListening
                      ? 'Transcribing your voice...'
                      : 'Type your answer or speak with mic...'
                  }
                  className="flex-1 min-w-0 h-10 bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-xl px-3.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                />

                <button
                  type="button"
                  onClick={() => void handleCandidateReply(typedMessage)}
                  disabled={!typedMessage.trim() || isAIStreaming}
                  aria-label="Send message"
                  className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isAIStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section B: Dynamic Engineering Workspace ── */}
        <section
          className={`relative flex flex-col min-h-0 transition-all duration-300 ${layoutMode === 'workspace'
              ? 'col-span-12'
              : layoutMode === 'dialogue'
                ? 'hidden'
                : 'col-span-12 lg:col-span-6 xl:col-span-5'
            }`}
        >
          {activeWorkspaceMode && (
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceMode(null);
                setLayoutMode('dialogue');
              }}
              aria-label="Hide helper workspace"
              title="Hide helper workspace"
              className="absolute right-3 top-14 z-30 grid place-items-center w-8 h-8 rounded-lg border border-gray-700 bg-gray-900/95 text-gray-300 hover:text-white hover:bg-gray-800 shadow-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {activeWorkspaceMode === 'coding' && (
            <CodingWorkspace
              problemId={currentSession?.config.dsaProblemId || 'two-sum'}
              onAskForHint={(hintIdx) => {
                void handleCandidateReply(
                  `I'm considering the approach, could you give me a slight hint for part ${hintIdx}?`
                );
              }}
            />
          )}

          {activeWorkspaceMode === 'system_design' && <SystemDesignWorkspace />}

          {activeWorkspaceMode === 'behavioral' && <BehavioralHelper />}
        </section>
      </div>

      {/* ───────────── End Interview Confirmation Modal ───────────── */}
      {showFinishConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-modal-title"
          aria-describedby="finish-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isFinishing) {
              setShowFinishConfirm(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 grid place-items-center text-red-400 shrink-0">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3
                  id="finish-modal-title"
                  className="text-base font-bold text-white tracking-tight"
                >
                  Complete &amp; Submit Interview?
                </h3>
                <p
                  id="finish-modal-description"
                  className="text-xs text-gray-400 mt-0.5"
                >
                  Your conversation and code will be evaluated by the AI.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2.5 text-xs text-gray-300 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white font-semibold">
                  {currentSession?.config.targetRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Exchanges:</span>
                <span className="text-blue-400 font-bold tabular-nums">
                  {messages.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Code Submitted:</span>
                <span
                  className={
                    codeSnippet?.trim() ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {codeSnippet?.trim()
                    ? 'Yes (Included in review)'
                    : 'None'}
                </span>
              </div>
            </div>

            {finishError && (
              <div
                role="alert"
                className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300"
              >
                {finishError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                disabled={isFinishing}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                Continue Interview
              </button>
              {finishError && (
                <button
                  type="button"
                  onClick={() => {
                    speechService.stopSpeaking();
                    speechService.stopListening();
                    setFinishError(null);
                    setShowFinishConfirm(false);
                    cancelSession();
                  }}
                  disabled={isFinishing}
                  className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  End without scorecard
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleConfirmFinish()}
                disabled={isFinishing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Performance...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Scorecard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};