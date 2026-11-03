import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Settings,
  ShieldAlert,
  Clock,
  Pause,
  Play,
  Cpu,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const Header: React.FC = () => {
  const {
    currentSession,
    activeTab,
    setActiveTab,
    settings,
    pauseSession,
    resumeSession,
    postureAlertActive,
  } = useInterviewStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!currentSession || currentSession.status !== 'in_progress') return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------- Presentation-only helpers (derived from existing state) ----------
  const isInProgress = currentSession?.status === 'in_progress';
  const isSettingsOpen = activeTab === 'settings';

  const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

  return (
    <header className="relative z-20 h-16 shrink-0 flex items-center gap-4 px-6 border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-xl select-none">
      {/* Subtle bottom accent line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* ───────────── Left: Brand ───────────── */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-blue-500/30 blur-md" />
          <div className="relative grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Prepmate
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI
            </span>
          </div>
          <p className="text-[11px] text-gray-500 truncate">Desktop Interview Studio</p>
        </div>
      </div>

      {/* ───────────── Center: Active session pill ───────────── */}
      {currentSession && activeTab === 'interview' && (
        <div className="shrink-0 flex items-center gap-3.5 pl-4 pr-1.5 py-1.5 rounded-full bg-gray-800/70 border border-gray-700/60 shadow-inner shadow-black/20">
          {/* Status + mode */}
          <div className="flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              {isInProgress && (
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full ${isInProgress ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
              />
            </span>
            <span className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">
              {currentSession.config.mode.replace('_', ' ')} Interview
            </span>
          </div>

          <div className="h-4 w-px bg-gray-700" />

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 text-xs font-mono tabular-nums ${isInProgress ? 'text-blue-300' : 'text-amber-300'
              }`}
            title="Elapsed time"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
            {!isInProgress && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-sans font-semibold uppercase tracking-wider text-amber-400">
                Paused
              </span>
            )}
          </div>

          {/* Pause / Resume */}
          {isInProgress ? (
            <button
              type="button"
              onClick={pauseSession}
              title="Pause Interview"
              aria-label="Pause Interview"
              className={`grid place-items-center w-7 h-7 rounded-full bg-gray-700/50 hover:bg-gray-600 active:scale-95 text-gray-300 hover:text-white transition-all cursor-pointer ${focusRing}`}
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeSession}
              title="Resume Interview"
              aria-label="Resume Interview"
              className={`grid place-items-center w-7 h-7 rounded-full bg-emerald-500/15 hover:bg-emerald-500 active:scale-95 border border-emerald-500/30 text-emerald-400 hover:text-white transition-all cursor-pointer ${focusRing}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      )}

      {/* ───────────── Right: Controls ───────────── */}
      <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
        {/* Posture warning */}
        {postureAlertActive && (
          <div
            role="alert"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium shadow-lg shadow-amber-500/10 animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Adjust Posture</span>
          </div>
        )}

        {/* AI engine status pill */}
        <div
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl bg-gray-800/70 border border-gray-700/70 text-xs text-gray-300 min-w-0"
          title={`AI engine: ${settings.activeProvider}`}
        >
          <span className="grid place-items-center w-6 h-6 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <span className="capitalize font-medium truncate max-w-[120px]">{settings.activeProvider}</span>
          <span className="relative flex w-1.5 h-1.5 shrink-0">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
        </div>

        <div className="h-6 w-px bg-gray-800" />

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          title="Open Settings"
          aria-label="Open Settings"
          aria-pressed={isSettingsOpen}
          className={`grid place-items-center w-9 h-9 rounded-xl border transition-all cursor-pointer active:scale-95 ${focusRing} ${isSettingsOpen
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-md shadow-blue-600/20'
              : 'bg-gray-800/70 hover:bg-gray-700 border-gray-700/70 text-gray-300 hover:text-white'
            }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </header>
  );
};