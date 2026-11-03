import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Square,
  Sparkles,
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
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { AIInterviewerAvatar } from './AIInterviewerAvatar';
import { WebcamMonitor } from './WebcamMonitor';
import { CodingWorkspace } from './CodingWorkspace';
import { BehavioralHelper } from './BehavioralHelper';
import { speechService } from '../../services/speechService';
import { ChatMessage } from '../../types/interview';

export const InterviewRoom: React.FC = () => {
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
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'coding' | 'behavioral' | 'system_design'>('coding');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Initialize workspace view according to interview track
  useEffect(() => {
    if (currentSession?.config.mode === 'behavioral') {
      setActiveWorkspaceMode('behavioral');
    } else if (currentSession?.config.mode === 'system_design') {
      setActiveWorkspaceMode('system_design');
    } else {
      setActiveWorkspaceMode('coding');
    }
  }, [currentSession]);

  // Scroll transcript to bottom on new messages
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Kick off the interview with the first interviewer opening question
  useEffect(() => {
    if (!currentSession || messages.length > 0) return;

    // Send initial greeting / question
    startInterviewGreeting();
  }, [currentSession]);

  const startInterviewGreeting = async () => {
    if (!currentSession) return;

    setIsAIStreaming(true);

    const greetingPrompt: ChatMessage = {
      id: 'system-init',
      role: 'candidate',
      content: `Hello, I'm ready for the ${currentSession.config.targetRole} interview at ${currentSession.config.targetCompany}. Please introduce yourself and start with the first question.`,
      timestamp: Date.now(),
    };

    let accumulatedText = '';
    await aiService.generateInterviewerResponse(
      currentSession.config,
      [greetingPrompt],
      '',
      {
        onChunk: (chunk) => {
          accumulatedText += chunk;
          updateLastInterviewerMessage(chunk);
          if (aiErrorMessage) setAiErrorMessage(null);
        },
        onComplete: (full) => {
          setIsAIStreaming(false);
          setAiErrorMessage(null);
          if (settings.autoSpeakResponse && !isMuted) {
            playVoiceResponse(full);
          }
        },
        onError: (err) => {
          setIsAIStreaming(false);
          setAiErrorMessage(err.message);
          console.error('Greeting error:', err);
          if (!accumulatedText) {
            updateLastInterviewerMessage(`⚠️ [AI Error: ${err.message}] Click the Settings icon in the top right to verify your Google Gemini API key or switch models.`);
          }
        },
      }
    );
  };

  const playVoiceResponse = (text: string) => {
    setIsSpeaking(true);
    speechService.speak(text, {
      voiceName: settings.ttsVoiceName || undefined,
      rate: settings.ttsRate,
      pitch: settings.ttsPitch,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        // If continuous hands-free mode is enabled, automatically resume listening
        if (settings.handsFreeContinuousMode && !isListening && !isMuted) {
          startVoiceRecognition();
        }
      },
    });
  };

  // Start continuous speech recognition
  const startVoiceRecognition = () => {
    if (isMuted) return;

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
          handleCandidateReply(text);
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

  const stopVoiceRecognition = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  // Candidate sends a reply (either via speech or typing)
  const handleCandidateReply = async (text: string) => {
    if (!text.trim() || !currentSession || isAIStreaming) return;

    // Interrupt any ongoing AI speech
    speechService.stopSpeaking();
    setIsSpeaking(false);

    // Add candidate reply to transcript
    addMessage({
      role: 'candidate',
      content: text.trim(),
    });

    setTypedMessage('');
    setIsAIStreaming(true);

    const updatedHistory = [
      ...messages,
      {
        id: 'temp-candidate',
        role: 'candidate' as const,
        content: text.trim(),
        timestamp: Date.now(),
      },
    ];

    let fullInterviewerResponse = '';
    await aiService.generateInterviewerResponse(
      currentSession.config,
      updatedHistory,
      codeSnippet,
      {
        onChunk: (chunk) => {
          fullInterviewerResponse += chunk;
          updateLastInterviewerMessage(chunk);
          if (aiErrorMessage) setAiErrorMessage(null);
        },
        onComplete: (full) => {
          setIsAIStreaming(false);
          setAiErrorMessage(null);
          if (settings.autoSpeakResponse && !isMuted) {
            playVoiceResponse(full);
          }
        },
        onError: (err) => {
          setIsAIStreaming(false);
          setAiErrorMessage(err.message);
          console.error('Response error:', err);
          if (!fullInterviewerResponse) {
            updateLastInterviewerMessage(`⚠️ [AI Response Error: ${err.message}] Check your Gemini API key in Settings.`);
          }
        },
      }
    );
  };

  const handleFinishInterview = async () => {
    if (!currentSession) return;
    setIsFinishing(true);
    speechService.stopSpeaking();
    speechService.stopListening();

    try {
      const scorecard = await aiService.generateEvaluationReport(
        currentSession.config,
        messages,
        codeSnippet
      );
      finishSession(scorecard);
    } catch (err) {
      console.error('Error generating scorecard:', err);
    } finally {
      setIsFinishing(false);
    }
  };

  // ---------- Presentation-only helpers (derived from existing state) ----------
  const workspaceTabs = [
    { id: 'coding' as const, label: 'Coding Sandbox', Icon: Code },
    { id: 'behavioral' as const, label: 'STAR Analysis', Icon: Users },
    { id: 'system_design' as const, label: 'System Design', Icon: Layers },
  ];

  const status = isAIStreaming
    ? { label: 'Thinking', dot: 'bg-amber-400', text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30', pulse: true }
    : isSpeaking
      ? { label: 'Speaking', dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30', pulse: true }
      : isListening
        ? { label: 'Listening', dot: 'bg-red-400', text: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30', pulse: true }
        : { label: 'Ready', dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-800/60 border-gray-700', pulse: false };

  const showTypingIndicator =
    isAIStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'candidate');

  const designSteps = [
    'Requirements',
    'Estimations',
    'Data Model',
    'High-Level Diagram',
    'Deep Dives',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 bg-gradient-to-b from-gray-950 to-black">
      {/* ───────────── Top Header Bar ───────────── */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/20">
        {/* Left: Session identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-white truncate leading-tight">
              {currentSession?.config.targetRole}
              <span className="text-gray-500 font-normal"> @ </span>
              {currentSession?.config.targetCompany}
            </span>
            <span className="mt-0.5 w-fit text-[10px] font-medium uppercase tracking-wider text-gray-400 capitalize">
              {currentSession?.config.candidateLevel} Level
            </span>
          </div>
        </div>

        {/* Center: Segmented mode switcher */}
        <div
          role="tablist"
          aria-label="Workspace mode"
          className="order-3 lg:order-none w-full lg:w-auto flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800"
        >
          {workspaceTabs.map(({ id, label, Icon }) => {
            const active = activeWorkspaceMode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveWorkspaceMode(id)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Status + End action */}
        <div className="flex items-center gap-3">
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium ${status.bg} ${status.text}`}
            aria-live="polite"
          >
            <span className="relative flex w-2 h-2">
              {status.pulse && (
                <span className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${status.dot}`} />
              )}
              <span className={`relative inline-flex w-2 h-2 rounded-full ${status.dot}`} />
            </span>
            {status.label}
          </div>

          <button
            type="button"
            onClick={handleFinishInterview}
            disabled={isFinishing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-md shadow-red-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Performance...</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>End Interview &amp; Get Scorecard</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ───────────── Main Split Grid ───────────── */}
      <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* ── Left Column: Video, Audio & Transcript ── */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 sm:gap-4 min-h-0">
          {/* Avatars row */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <AIInterviewerAvatar
              isSpeaking={isSpeaking}
              isListening={isListening}
              isAIStreaming={isAIStreaming}
              companyName={currentSession?.config.targetCompany || 'Tech'}
            />
            <WebcamMonitor enabled={currentSession?.config.videoEnabled ?? true} />
          </div>

          {/* Transcript card */}
          <div className="flex-1 min-h-[420px] lg:min-h-0 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col overflow-hidden shadow-2xl shadow-black/40">
            {/* Card header */}
            <div className="shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                <span className="grid place-items-center w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                </span>
                <span>Live Conversation Transcript</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono px-2 py-0.5 rounded-full bg-gray-800/80 border border-gray-700">
                {messages.length} {messages.length === 1 ? 'exchange' : 'exchanges'}
              </span>
            </div>

            {/* AI Warning Banner */}
            {aiErrorMessage && (
              <div className="shrink-0 mx-3 mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-300">AI Service Notice</p>
                    <p className="text-[11px] text-red-200/90 leading-relaxed">{aiErrorMessage}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiErrorMessage(null)}
                  className="text-red-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                  title="Dismiss"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-700">
              {/* Empty state */}
              {messages.length === 0 && !isAIStreaming && !interimTranscript && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-gray-500">
                  <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <p className="text-xs font-medium text-gray-400">Your conversation will appear here</p>
                  <p className="text-[11px] text-gray-600">Speak with the mic or type your answer below.</p>
                </div>
              )}

              {messages.map((msg) => {
                const isCandidate = msg.role === 'candidate';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isCandidate ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar chip */}
                    <div
                      className={`grid place-items-center w-7 h-7 shrink-0 rounded-full border ${isCandidate
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                          : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}
                    >
                      {isCandidate ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className={`flex flex-col max-w-[82%] ${isCandidate ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500">
                        <span className="font-semibold text-gray-300">
                          {isCandidate ? 'You' : 'AI Interviewer'}
                        </span>
                        <span aria-hidden>•</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap break-words shadow-sm ${isCandidate
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md shadow-blue-900/30'
                            : 'bg-gray-800/90 text-gray-200 border border-gray-700/80 rounded-bl-md'
                          }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator while the interviewer is preparing a reply */}
              {showTypingIndicator && (
                <div className="flex items-end gap-2">
                  <div className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-gray-800/90 border border-gray-700/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </div>
                </div>
              )}

              {/* Interim voice transcript indicator */}
              {interimTranscript && (
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-blue-300/80">
                    <Mic className="w-3 h-3" />
                    Transcribing...
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 bg-blue-900/30 border border-blue-500/30 text-blue-200 text-xs italic animate-pulse">
                    “{interimTranscript}…”
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Composer */}
            <div className="shrink-0 p-3 border-t border-gray-800 bg-gray-900/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopVoiceRecognition();
                    } else {
                      startVoiceRecognition();
                    }
                  }}
                  aria-label={isListening ? 'Stop Listening' : 'Speak to Interviewer'}
                  aria-pressed={isListening}
                  className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/30'
                    }`}
                  title={isListening ? 'Stop Listening' : 'Speak to Interviewer'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                  aria-pressed={isMuted}
                  className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${isMuted
                      ? 'bg-gray-900 text-gray-500 border-gray-800'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                    }`}
                  title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Text input fallback */}
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCandidateReply(typedMessage);
                  }}
                  placeholder={isListening ? 'Listening to your speech...' : 'Type your answer or speak with mic...'}
                  aria-label="Type your answer"
                  className="flex-1 min-w-0 h-10 bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-xl px-3.5 text-xs text-white placeholder:text-gray-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  onClick={() => handleCandidateReply(typedMessage)}
                  disabled={!typedMessage.trim() || isAIStreaming}
                  aria-label="Send message"
                  className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  {isAIStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2 px-1 flex items-center justify-between text-[10px] text-gray-600">
                <span>
                  Press <kbd className="px-1 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400 font-mono">Enter</kbd> to send
                </span>
                {isMuted && <span className="text-gray-500">AI voice muted</span>}
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Column: Dynamic Workspace ── */}
        <section className="col-span-12 lg:col-span-7 flex flex-col min-h-[480px] lg:min-h-0">
          {activeWorkspaceMode === 'coding' && (
            <CodingWorkspace
              problemId={currentSession?.config.dsaProblemId || 'two-sum'}
              onAskForHint={(hintIdx) => {
                handleCandidateReply(`I'm considering the approach, could you give me a slight hint for part ${hintIdx}?`);
              }}
            />
          )}

          {activeWorkspaceMode === 'behavioral' && <BehavioralHelper />}

          {activeWorkspaceMode === 'system_design' && (
            <div className="flex-1 flex flex-col min-h-0 bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl shadow-black/40 overflow-hidden">
              {/* Panel header */}
              <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-800 bg-gray-900/40 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">
                      System Design Architecture Whiteboard
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Structure your thinking before walking the interviewer through it.
                    </p>
                  </div>
                </div>

                {/* Step chips */}
                <ol className="flex flex-wrap items-center gap-1.5">
                  {designSteps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-[11px] text-gray-300"
                    >
                      <span className="grid place-items-center w-4 h-4 rounded-full bg-blue-600/20 text-blue-300 text-[9px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes area */}
              <div className="flex-1 min-h-0 p-4">
                <textarea
                  placeholder="Sketch your architecture notes, database schemas, and service boundaries here..."
                  aria-label="System design notes"
                  spellCheck={false}
                  className="w-full h-full bg-gray-900/70 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-xs font-mono text-gray-200 placeholder:text-gray-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};