import React from 'react';
import { Volume2, Mic, Bot, Sparkles } from 'lucide-react';

interface AIInterviewerAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isAIStreaming: boolean;
  companyName: string;
}

export const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  isSpeaking,
  isListening,
  isAIStreaming,
  companyName,
}) => {
  return (
    <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-b from-gray-800/90 via-gray-900 to-gray-950 border border-gray-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
      {/* Dynamic Animated Pulse Rings */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full border border-blue-500/30 animate-ping" />
          <div className="w-64 h-64 rounded-full border border-indigo-500/20 animate-pulse" />
        </div>
      )}

      {/* Central Visual Avatar */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isSpeaking
              ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/40 scale-105'
              : isListening
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/30'
              : 'bg-gradient-to-tr from-gray-700 to-gray-800'
          }`}
        >
          <Bot className="w-10 h-10 text-white" />

          {/* Mini Status Badge */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gray-900 border border-gray-700">
            {isSpeaking ? (
              <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            ) : isListening ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Labels & State */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {companyName} Senior Interviewer
          </h3>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-800/90 border border-gray-700 text-[11px] font-medium">
            {isSpeaking ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-300">Speaking...</span>
              </>
            ) : isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Listening to you...</span>
              </>
            ) : isAIStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300">Thinking...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-gray-400">Ready</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Waveform Bars at bottom */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-center gap-1.5 h-6">
        {[20, 45, 80, 60, 95, 75, 40, 85, 55, 30, 90, 65, 45, 80, 35].map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              isSpeaking
                ? 'bg-blue-500'
                : isListening
                ? 'bg-emerald-500'
                : 'bg-gray-700/50'
            }`}
            style={{
              height: isSpeaking || isListening ? `${height}%` : '20%',
              opacity: isSpeaking || isListening ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
};

