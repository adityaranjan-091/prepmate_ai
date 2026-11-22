import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  ShieldAlert,
  Clock,
  Pause,
  Play,
  Cpu,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { useAuthStore } from '../../store/authStore';

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

  const { user, signOut } = useAuthStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!currentSession) {
      setElapsedSeconds(0);
      return;
    }

    const computeElapsed = () =>
      Math.max(0, Math.floor((Date.now() - currentSession.startTime) / 1000));

    // Sync immediately on mount or status change so there is no 1s lag
    setElapsedSeconds(computeElapsed());

    if (currentSession.status !== 'in_progress') return;

    const timer = setInterval(() => {
      setElapsedSeconds(computeElapsed());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isInProgress = currentSession?.status === 'in_progress';
  const isSettingsOpen = activeTab === 'settings';

  const activeModel =
    settings.activeProvider === 'gemini'
      ? settings.geminiModel
      : settings.activeProvider === 'groq'
        ? settings.groqModel
        : settings.ollamaModel;

  const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="relative z-20 h-16 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:px-6 border-b border-gray-800/80 bg-gray-900/85 backdrop-blur-xl select-none">
      {/* Subtle bottom accent line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* ───────────── Left: Brand ───────────── */}
      <div className="flex items-center min-w-0 justify-self-start">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          title="Return to Dashboard"
          className={`group flex items-center gap-3 text-left rounded-xl p-1 -ml-1 transition cursor-pointer min-w-0 ${focusRing}`}
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md group-hover:bg-blue-500/30 transition-colors" />
            <img
              src="/logo.png"
              alt="Prepmate AI Logo"
              className="relative w-9 h-9 rounded-xl object-contain shadow-md ring-1 ring-white/10 group-hover:ring-blue-400/30 bg-gray-900/70 p-1 transition"
            />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base lg:text-lg tracking-tight bg-gradient-to-r from-white to-gray-300 group-hover:from-white group-hover:to-blue-200 bg-clip-text text-transparent transition">
                Prepmate
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate">Desktop Interview Studio</p>
          </div>
        </button>
      </div>

      {/* ───────────── Center: Active session pill ───────────── */}
      <div className="justify-self-center">
        {currentSession && activeTab === 'interview' && (
          <div className="flex items-center gap-3 sm:gap-3.5 pl-4 pr-1.5 py-1.5 rounded-full bg-gray-800/80 border border-gray-700/70 shadow-inner shadow-black/25">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                {isInProgress && (
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex w-2 h-2 rounded-full ${isInProgress ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                />
              </span>
              <span className="hidden md:inline text-[11px] font-semibold text-gray-200 uppercase tracking-wider">
                {currentSession.config.mode.replace('_', ' ')} Interview
              </span>
            </div>

            <div className="hidden md:block h-4 w-px bg-gray-700/80" />

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 text-xs font-mono font-medium tabular-nums ${isInProgress ? 'text-blue-300' : 'text-amber-300'
                }`}
              title="Elapsed session time"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
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
                className={`grid place-items-center w-7 h-7 rounded-full bg-gray-700/60 hover:bg-gray-600 active:scale-95 text-gray-300 hover:text-white transition-all cursor-pointer ${focusRing}`}
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
      </div>

      {/* ───────────── Right: Controls ───────────── */}
      <div className="flex items-center justify-end gap-2.5 sm:gap-3 min-w-0 justify-self-end">
        {/* Posture warning */}
        {postureAlertActive && (
          <div
            role="alert"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium shadow-lg shadow-amber-500/10 animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Adjust Posture</span>
          </div>
        )}

        {/* AI engine status pill */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          title={`AI Engine: ${settings.activeProvider}${activeModel ? ` (${activeModel})` : ''} — Click to configure`}
          className={`hidden sm:flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-xl bg-gray-800/75 hover:bg-gray-800 border border-gray-700/70 hover:border-gray-600 text-xs text-gray-300 transition cursor-pointer min-w-0 ${focusRing}`}
        >
          <span className="grid place-items-center w-6 h-6 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <span className="capitalize font-semibold text-gray-200 truncate">
            {settings.activeProvider}
          </span>
          {activeModel && (
            <span className="hidden xl:inline text-[11px] font-mono text-gray-400 truncate max-w-[130px] pl-1 border-l border-gray-700/80">
              {activeModel}
            </span>
          )}
          <span className="relative flex w-1.5 h-1.5 shrink-0 ml-0.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          title="Open Settings"
          aria-label="Open Settings"
          aria-pressed={isSettingsOpen}
          className={`grid place-items-center w-9 h-9 shrink-0 rounded-xl border transition-all cursor-pointer active:scale-95 ${focusRing} ${isSettingsOpen
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-md shadow-blue-600/20'
              : 'bg-gray-800/75 hover:bg-gray-700 border-gray-700/70 text-gray-300 hover:text-white'
            }`}
        >
          <Settings
            className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''
              }`}
          />
        </button>

        {/* User Account Dropdown */}
        {user && (
          <div
            ref={userMenuRef}
            className="relative flex items-center pl-2.5 border-l border-gray-800"
          >
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              title="User Account Menu"
              className={`flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl border text-xs transition cursor-pointer select-none active:scale-[0.98] ${focusRing} ${isUserMenuOpen || activeTab === 'profile'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 ring-1 ring-blue-500/30'
                  : 'bg-gray-800/70 hover:bg-gray-700/80 border-gray-700/70 text-gray-200'
                }`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={userDisplayName}
                  className="w-6 h-6 rounded-lg object-cover ring-1 ring-blue-500/40 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-[10px] grid place-items-center ring-1 ring-white/10 uppercase shrink-0">
                  {userDisplayName.slice(0, 2)}
                </div>
              )}
              <span className="hidden sm:inline font-semibold max-w-[120px] truncate">
                {userDisplayName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl shadow-black/80 p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 space-y-1"
              >
                {/* User Summary Header */}
                <div className="px-3 py-2.5 rounded-xl bg-gray-800/50 border border-gray-800/90 mb-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={userDisplayName}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs grid place-items-center ring-1 ring-white/10 uppercase shrink-0">
                        {userDisplayName.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-gray-400 truncate" title={user.email || ''}>
                        {user.email || 'Authenticated'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Candidate Profile Option */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition cursor-pointer ${activeTab === 'profile'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/70 border border-transparent'
                    }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Candidate Profile</p>
                    <p className="text-[10px] text-gray-400">Education, skills &amp; experience</p>
                  </div>
                </button>

                {/* Settings Option */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition cursor-pointer ${activeTab === 'settings'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/70 border border-transparent'
                    }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Preferences &amp; Models</p>
                    <p className="text-[10px] text-gray-400">AI provider, voice &amp; telemetry</p>
                  </div>
                </button>

                <div className="my-1 border-t border-gray-800" />

                {/* Sign Out Option */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};