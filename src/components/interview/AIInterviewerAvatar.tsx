import React, { useMemo } from 'react';
import { Volume2, Mic, Bot, Sparkles, Loader2 } from 'lucide-react';

export interface AIInterviewerAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isAIStreaming: boolean;
  companyName?: string;
  interviewerRole?: string;
  compact?: boolean;
}

const WAVEFORM_BARS = [24, 48, 82, 60, 95, 72, 42, 88, 56, 34, 90, 66, 46, 78, 36];

type AvatarState = 'speaking' | 'listening' | 'thinking' | 'idle';

export const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  isSpeaking,
  isListening,
  isAIStreaming,
  companyName = 'Top Tech',
  interviewerRole = 'Senior Interviewer',
  compact = false,
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
            'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/40',
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
            'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/30',
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
            'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-xl shadow-amber-500/30',
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
          avatarBg: 'bg-gradient-to-tr from-gray-700 to-gray-800',
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

  // Compact Dock Mode (Slim, low-profile status card)
  if (compact) {
    return (
      <div className="flex-1 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-gray-900/90 border border-gray-800 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-lg ${stateUI.avatarBg} grid place-items-center text-white ring-1 ring-white/10`}>
              <Bot className="w-4 h-4" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-gray-950 ${stateUI.dotColor}`} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              AI Interviewer <span className="text-[10px] text-gray-500 font-normal">({companyName})</span>
            </p>
            <p className={`text-[10px] font-medium ${stateUI.textColor} truncate mt-0.5`}>
              {stateUI.label}
            </p>
          </div>
        </div>

        {/* Mini waveform bars */}
        <div className="flex items-center gap-0.5 h-4 shrink-0 px-2 py-0.5 rounded-md bg-gray-950/60 border border-gray-800/80">
          {WAVEFORM_BARS.slice(0, 7).map((height, idx) => (
            <span
              key={idx}
              className={`w-0.5 rounded-full transition-all duration-200 ${stateUI.barColor}`}
              style={{
                height: isActiveAudio ? `${Math.max(20, height * 0.35)}%` : '20%',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Expanded Stage Mode
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
            className={`w-44 h-44 rounded-full border ${stateUI.ringPrimary} ${
              isActiveAudio ? 'animate-ping' : 'animate-pulse'
            }`}
          />
          <div className={`w-32 h-32 rounded-full border ${stateUI.ringSecondary} animate-pulse`} />
        </div>
      )}

      {/* Main Avatar Centerpiece */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className={`w-20 h-20 rounded-2xl ${stateUI.avatarBg} grid place-items-center text-white ring-1 ring-white/20 transition-all duration-500`}
          >
            <Bot className="w-10 h-10" />
          </div>

          <span
            className={`absolute -bottom-1 -right-1 grid place-items-center w-6 h-6 rounded-full bg-gray-950 border border-gray-700/80 shadow-md`}
          >
            <BadgeIcon className={`w-3.5 h-3.5 ${stateUI.badgeIconClass}`} />
          </span>
        </div>

        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stateUI.dotColor}`} />
            <span className="text-xs font-semibold text-gray-200">{companyName} Interviewer</span>
          </div>
          <p className="text-[11px] text-gray-400">{interviewerRole}</p>
        </div>
      </div>

      {/* Audio Waveform Visualizer */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1 h-6 pointer-events-none px-6">
        {WAVEFORM_BARS.map((height, idx) => (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-300 ${stateUI.barColor}`}
            style={{
              height: isActiveAudio ? `${Math.max(15, height * 0.7)}%` : '15%',
            }}
          />
        ))}
      </div>
    </div>
  );
};
