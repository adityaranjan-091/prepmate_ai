import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Settings,
  ShieldAlert,
  Clock,
  Square,
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

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-tight">Prepmate</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI
            </span>
          </div>
          <p className="text-xs text-gray-400">Desktop Interview Studio</p>
        </div>
      </div>

      {/* Middle Status (Active Session) */}
      {currentSession && activeTab === 'interview' && (
        <div className="flex items-center gap-4 bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700/60 shadow-inner">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentSession.status === 'in_progress' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-medium text-gray-200 uppercase tracking-wide">
              {currentSession.config.mode.replace('_', ' ')} Interview
            </span>
          </div>

          <div className="h-3 w-[1px] bg-gray-700" />

          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {currentSession.status === 'in_progress' ? (
            <button
              onClick={pauseSession}
              title="Pause Interview"
              className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={resumeSession}
              title="Resume Interview"
              className="p-1 hover:bg-gray-700 rounded-full text-emerald-400 hover:text-white transition"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Posture Warning Notification */}
        {postureAlertActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Adjust Posture</span>
          </div>
        )}

        {/* AI Engine Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="capitalize font-medium">{settings.activeProvider}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition shadow-sm"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

