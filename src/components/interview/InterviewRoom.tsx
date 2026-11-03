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
        },
        onComplete: (full) => {
          setIsAIStreaming(false);
          if (settings.autoSpeakResponse && !isMuted) {
            playVoiceResponse(full);
          }
        },
        onError: (err) => {
          setIsAIStreaming(false);
          console.error('Greeting error:', err);
          updateLastInterviewerMessage(`Hello and welcome! Let's begin your interview for the ${currentSession.config.targetRole} position at ${currentSession.config.targetCompany}. To start off, could you briefly introduce yourself and share your core background?`);
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
        },
        onComplete: (full) => {
          setIsAIStreaming(false);
          if (settings.autoSpeakResponse && !isMuted) {
            playVoiceResponse(full);
          }
        },
        onError: (err) => {
          setIsAIStreaming(false);
          console.error('Response error:', err);
          updateLastInterviewerMessage('Thank you. Could you elaborate on your design decisions and how you would verify this solution under scale?');
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-gray-900/90 border border-gray-800 rounded-xl px-5 py-2.5 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-white">
            {currentSession?.config.targetRole} @ {currentSession?.config.targetCompany}
          </span>
          <span className="text-xs text-gray-400 capitalize px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700">
            {currentSession?.config.candidateLevel} Level
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveWorkspaceMode('coding')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              activeWorkspaceMode === 'coding' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Coding Sandbox</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceMode('behavioral')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              activeWorkspaceMode === 'behavioral' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>STAR Analysis</span>
          </button>
        </div>

        {/* End Interview Action */}
        <button
          onClick={handleFinishInterview}
          disabled={isFinishing}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md shadow-red-600/30 disabled:opacity-50 cursor-pointer"
        >
          {isFinishing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Performance...</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>End Interview & Get Scorecard</span>
            </>
          )}
        </button>
      </div>

      {/* Main Center Area: Split Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column (Video & Audio & Transcript): 5 cols */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 min-h-0">
          {/* Top Video Avatars Row: Interviewer + Candidate */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <AIInterviewerAvatar
              isSpeaking={isSpeaking}
              isListening={isListening}
              isAIStreaming={isAIStreaming}
              companyName={currentSession?.config.targetCompany || 'Tech'}
            />
            <WebcamMonitor enabled={currentSession?.config.videoEnabled ?? true} />
          </div>

          {/* Transcript Log Container */}
          <div className="flex-1 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col min-h-0 overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Live Conversation Transcript</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {messages.length} exchanges
              </span>
            </div>

            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'candidate' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                    <span className="font-semibold text-gray-300 capitalize">
                      {msg.role === 'candidate' ? 'You (Candidate)' : 'AI Interviewer'}
                    </span>
                    <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      msg.role === 'candidate'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Interim voice transcript indicator */}
              {interimTranscript && (
                <div className="flex flex-col items-end">
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2 bg-blue-900/40 border border-blue-500/40 text-blue-200 text-xs italic animate-pulse">
                    "{interimTranscript}..."
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Bottom Input & Speech Controls */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/80 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isListening) {
                      stopVoiceRecognition();
                    } else {
                      startVoiceRecognition();
                    }
                  }}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak to Interviewer'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-xl border transition ${
                    isMuted
                      ? 'bg-gray-800 text-gray-500 border-gray-700'
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
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />

                <button
                  onClick={() => handleCandidateReply(typedMessage)}
                  disabled={!typedMessage.trim() || isAIStreaming}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Dynamic Workspace): 7 cols */}
        <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0">
          {activeWorkspaceMode === 'coding' && (
            <CodingWorkspace
              problemId={currentSession?.config.dsaProblemId || 'two-sum'}
              onAskForHint={(hintIdx) => {
                handleCandidateReply(`I'm considering the approach, could you give me a slight hint for part ${hintIdx}?`);
              }}
            />
          )}

          {activeWorkspaceMode === 'behavioral' && (
            <BehavioralHelper />
          )}

          {activeWorkspaceMode === 'system_design' && (
            <div className="flex-1 flex flex-col bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white">System Design Architecture Whiteboard</h2>
              <p className="text-xs text-gray-400">
                Structure your design: 1. Functional & Non-Functional Requirements &rarr; 2. Estimations (QPS, Storage) &rarr; 3. Data Model & Schema &rarr; 4. High-Level Diagram &rarr; 5. Deep Dives (Caching, Queues, Partitioning).
              </p>
              <textarea
                placeholder="Sketch your architecture notes, database schemas, and service boundaries here..."
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

