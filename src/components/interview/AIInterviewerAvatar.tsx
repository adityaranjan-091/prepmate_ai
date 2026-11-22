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

const WAVEFORM_BARS = [28, 52, 86, 62, 96, 74, 44, 90, 58, 36, 92, 68, 48, 80, 38];

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
            'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/35',
          ambientGlow:
            'bg-[radial-gradient(circle_at_50%_45%,rgba(59,130,246,0.16),transparent_68%)]',
          ringPrimary: 'border-blue-400/30',
          ringSecondary: 'border-indigo-400/20',
          dotColor: 'bg-blue-400 animate-pulse motion-reduce:animate-none',
          textColor: 'text-blue-300',
          label: 'Speaking',
          barColor: 'bg-blue-400',
          BadgeIcon: Volume2,
          badgeIconClass: 'text-blue-400 animate-pulse motion-reduce:animate-none',
        };
      case 'listening':
        return {
          avatarBg:
            'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/30',
          ambientGlow:
            'bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.14),transparent_68%)]',
          ringPrimary: 'border-emerald-400/30',
          ringSecondary: 'border-teal-400/20',
          dotColor: 'bg-emerald-400 animate-pulse motion-reduce:animate-none',
          textColor: 'text-emerald-300',
          label: 'Listening',
          barColor: 'bg-emerald-400',
          BadgeIcon: Mic,
          badgeIconClass: 'text-emerald-400 animate-bounce motion-reduce:animate-none',
        };
      case 'thinking':
        return {
          avatarBg:
            'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-lg shadow-amber-500/30',
          ambientGlow:
            'bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.14),transparent_68%)]',
          ringPrimary: 'border-amber-400/25',
          ringSecondary: 'border-orange-400/15',
          dotColor: 'bg-amber-400 animate-pulse motion-reduce:animate-none',
          textColor: 'text-amber-300',
          label: 'Thinking',
          barColor: 'bg-amber-400',
          BadgeIcon: Loader2,
          badgeIconClass: 'text-amber-400 animate-spin motion-reduce:animate-none',
        };
      default:
        return {
          avatarBg: 'bg-gradient-to-tr from-gray-700 to-gray-800',
          ambientGlow:
            'bg-[radial-gradient(circle_at_50%_45%,rgba(148,163,184,0.06),transparent_68%)]',
          ringPrimary: 'border-transparent',
          ringSecondary: 'border-transparent',
          dotColor: 'bg-gray-500',
          textColor: 'text-gray-400',
          label: 'Ready',
          barColor: 'bg-gray-700/60',
          BadgeIcon: Sparkles,
          badgeIconClass: 'text-gray-400',
        };
    }
  }, [currentState]);

  const { BadgeIcon } = stateUI;
  const isActiveAudio = currentState === 'speaking' || currentState === 'listening';

  // Compact Dock Mode (Low-profile horizontal card safe inside narrow CSS grid cells)
  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-w-0 flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-gray-900/90 border border-gray-800 shadow-md select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div
              aria-hidden="true"
              className={`w-8 h-8 rounded-lg ${stateUI.avatarBg} grid place-items-center text-white ring-1 ring-white/15 transition-all duration-300`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <span
              aria-hidden="true"
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-gray-950 ${stateUI.dotColor}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate leading-tight">
                {companyName}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <BadgeIcon
                aria-hidden="true"
                className={`w-3 h-3 shrink-0 ${stateUI.badgeIconClass}`}
              />
              <span className={`text-[10px] font-medium ${stateUI.textColor} truncate`}>
                {stateUI.label}
              </span>
            </div>
          </div>
        </div>

        {/* Mini animated waveform bars */}
        <div
          aria-hidden="true"
          className="hidden sm:flex items-center gap-0.5 h-5 shrink-0 px-2 py-1 rounded-lg bg-gray-950/70 border border-gray-800/80"
        >
          {WAVEFORM_BARS.slice(0, 6).map((height, idx) => (
            <span
              key={idx}
              className={`w-0.5 rounded-full transition-all duration-200 ${stateUI.barColor} ${
                isActiveAudio ? 'animate-pulse motion-reduce:animate-none' : ''
              }`}
              style={{
                height: isActiveAudio ? `${Math.max(24, height * 0.45)}%` : '24%',
                animationDelay: `${idx * 110}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Expanded Stage Mode (Responsive sizing so narrow split-view tiles never clip)
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative w-full aspect-video min-w-0 rounded-2xl bg-gradient-to-b from-gray-800/90 via-gray-900 to-gray-950 border border-gray-800 ring-1 ring-inset ring-white/5 flex flex-col justify-between p-2.5 xl:p-3.5 overflow-hidden shadow-2xl select-none"
    >
      {/* State-Matched Ambient Stage Glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${stateUI.ambientGlow}`}
      />

      {/* Top Stage HUD Bar */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-950/75 border border-gray-800/90 backdrop-blur-sm text-[10px] font-semibold text-gray-200 truncate min-w-0">
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${stateUI.dotColor}`}
          />
          <span className="truncate">{companyName}</span>
        </span>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-950/75 border border-gray-800/90 backdrop-blur-sm text-[10px] font-medium shrink-0 ${stateUI.textColor}`}
        >
          <BadgeIcon
            aria-hidden="true"
            className={`w-2.5 h-2.5 shrink-0 ${stateUI.badgeIconClass}`}
          />
          <span>{stateUI.label}</span>
        </span>
      </div>

      {/* Subtle Animated Pulse Rings */}
      {currentState !== 'idle' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className={`w-28 h-28 xl:w-36 xl:h-36 rounded-full border ${stateUI.ringPrimary} animate-pulse motion-reduce:animate-none`}
          />
          <div
            style={{ animationDelay: '350ms' }}
            className={`w-20 h-20 xl:w-28 xl:h-28 rounded-full border ${stateUI.ringSecondary} animate-pulse motion-reduce:animate-none`}
          />
        </div>
      )}

      {/* Main Avatar Centerpiece */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 xl:gap-2 my-auto min-h-0">
        <div className="relative">
          <div
            aria-hidden="true"
            className={`w-11 h-11 xl:w-14 xl:h-14 rounded-2xl ${stateUI.avatarBg} grid place-items-center text-white ring-1 ring-white/20 transition-all duration-500`}
          >
            <Bot className="w-6 h-6 xl:w-7 xl:h-7" />
          </div>

          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 grid place-items-center w-5 h-5 rounded-full bg-gray-950 border border-gray-700/80 shadow-md"
          >
            <BadgeIcon className={`w-2.5 h-2.5 ${stateUI.badgeIconClass}`} />
          </span>
        </div>

        <div className="text-center max-w-full px-2">
          <h3 className="text-xs font-semibold text-white tracking-tight truncate">
            {companyName} Interviewer
          </h3>
          <p className="hidden xl:block text-[11px] text-gray-400 truncate">
            {interviewerRole}
          </p>
        </div>
      </div>

      {/* Bottom Audio Waveform Telemetry Dock */}
      <div
        aria-hidden="true"
        className="relative z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="inline-flex items-center justify-center gap-1 h-5 xl:h-6 px-3 py-1 rounded-lg bg-gray-950/75 border border-gray-800/80 backdrop-blur-sm">
          {WAVEFORM_BARS.map((height, idx) => (
            <span
              key={idx}
              className={`w-0.5 xl:w-1 rounded-full transition-all duration-300 ${stateUI.barColor} ${
                isActiveAudio ? 'animate-pulse motion-reduce:animate-none' : ''
              }`}
              style={{
                height: isActiveAudio ? `${Math.max(22, height * 0.78)}%` : '22%',
                animationDelay: `${idx * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};