import React, { useMemo } from 'react';
import { Volume2, Mic, Bot, Sparkles, Loader2 } from 'lucide-react';

export interface AIInterviewerAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isAIStreaming: boolean;
  companyName?: string;
  interviewerRole?: string;
}

const WAVEFORM_BARS = [24, 48, 82, 60, 95, 72, 42, 88, 56, 34, 90, 66, 46, 78, 36];

type AvatarState = 'speaking' | 'listening' | 'thinking' | 'idle';

export const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  isSpeaking,
  isListening,
  isAIStreaming,
  companyName = 'Top Tech',
  interviewerRole = 'Senior Interviewer',
}) => {
  const currentState: AvatarState = useMemo(() => {
    if (isSpeaking) return 'speaking';
    if (isAIStreaming) return 'thinking';
    if (isListening) return 'listening';
    return 'idle';
  }, [isSpeaking, isAIStreaming, isListening]);

  const stateUI = useMemo(() => {
    switch (currentState) {
      case 'speaking':
        return {
          avatarBg:
            'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/40 scale-105',
          ringPrimary: 'border-blue-500/30',
          ringSecondary: 'border-indigo-500/20',
          dotColor: 'bg-blue-400 animate-pulse',
          textColor: 'text-blue-300',
          label: 'Speaking...',
          barColor: 'bg-blue-500',
          BadgeIcon: Volume2,
          badgeIconClass: 'text-blue-400 animate-pulse',
        };
      case 'listening':
        return {
          avatarBg:
            'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/30 scale-100',
          ringPrimary: 'border-emerald-500/25',
          ringSecondary: 'border-teal-500/15',
          dotColor: 'bg-emerald-400 animate-pulse',
          textColor: 'text-emerald-300',
          label: 'Listening to you...',
          barColor: 'bg-emerald-500',
          BadgeIcon: Mic,
          badgeIconClass: 'text-emerald-400 animate-bounce',
        };
      case 'thinking':
        return {
          avatarBg:
            'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-xl shadow-amber-500/30 scale-100',
          ringPrimary: 'border-amber-500/25',
          ringSecondary: 'border-orange-500/15',
          dotColor: 'bg-amber-400 animate-pulse',
          textColor: 'text-amber-300',
          label: 'Thinking...',
          barColor: 'bg-amber-500',
          BadgeIcon: Loader2,
          badgeIconClass: 'text-amber-400 animate-spin',
        };
      default:
        return {
          avatarBg: 'bg-gradient-to-tr from-gray-700 to-gray-800 scale-100',
          ringPrimary: 'border-transparent',
          ringSecondary: 'border-transparent',
          dotColor: 'bg-gray-500',
          textColor: 'text-gray-400',
          label: 'Ready',
          barColor: 'bg-gray-700/50',
          BadgeIcon: Sparkles,
          badgeIconClass: 'text-gray-400',
        };
    }
  }, [currentState]);

  const { BadgeIcon } = stateUI;
  const isActiveAudio = currentState === 'speaking' || currentState === 'listening';

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative w-full aspect-video rounded-2xl bg-gradient-to-b from-gray-800/90 via-gray-900 to-gray-950 border border-gray-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl select-none"
    >
      {/* Dynamic Animated Pulse Rings */}
      {currentState !== 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-44 h-44 rounded-full border ${stateUI.ringPrimary} ${isActiveAudio ? 'animate-ping' : 'animate-pulse'
              }`}
            style={{ animationDuration: isSpeaking ? '2s' : '3s' }}
          />
          <div
            className={` absolute w-60 h-60 rounded-full border ${stateUI.ringSecondary} animate-pulse`}
          />
        </div>
      )}

      {/* Central Visual Avatar */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${stateUI.avatarBg}`}
        >
          <Bot className="w-10 h-10 text-white" />

          {/* Mini Status Badge */}
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gray-900 border border-gray-700 shadow-md">
            <BadgeIcon className={`w-3.5 h-3.5 ${stateUI.badgeIconClass}`} />
          </div>
        </div>

        {/* Labels & State */}
        <div className="text-center space-y-1.5 px-4">
          <h3 className="text-sm font-semibold text-white tracking-wide truncate max-w-xs">
            {companyName.trim() || 'Top Tech'} {interviewerRole}
          </h3>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-800/90 border border-gray-700 text-[11px] font-medium">
            <span className={`w-2 h-2 rounded-full ${stateUI.dotColor}`} />
            <span className={stateUI.textColor}>{stateUI.label}</span>
          </div>
        </div>
      </div>

      {/* Decorative Waveform Bars at bottom */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-center gap-1.5 h-6 pointer-events-none">
        {WAVEFORM_BARS.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${stateUI.barColor} ${isActiveAudio ? 'animate-pulse' : ''
              }`}
            style={{
              height: isActiveAudio
                ? `${height}%`
                : currentState === 'thinking'
                  ? '35%'
                  : '20%',
              opacity: currentState === 'idle' ? 0.4 : 0.95,
              animationDelay: isActiveAudio ? `${(i % 5) * 120}ms` : '0ms',
              animationDuration: isSpeaking ? '700ms' : '1100ms',
            }}
          />
        ))}
      </div>
    </div>
  );
};