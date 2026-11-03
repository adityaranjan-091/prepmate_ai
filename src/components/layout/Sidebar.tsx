import React from 'react';
import {
  LayoutDashboard,
  Video,
  Code2,
  FileText,
  History,
  Sliders,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentSession } = useInterviewStore();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'setup',
      label: 'Start Interview',
      icon: Video,
      badge: currentSession?.status === 'in_progress' ? 'LIVE' : undefined,
    },
    {
      id: 'interview',
      label: 'Interview Studio',
      icon: Code2,
      hidden: !currentSession,
    },
    {
      id: 'report',
      label: 'Scorecard',
      icon: FileText,
      hidden: !currentSession?.scorecard,
    },
    {
      id: 'history',
      label: 'History & Analytics',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Sliders,
    },
  ];

  // ---------- Presentation-only helpers (derived from existing state) ----------
  const isSessionLive = currentSession?.status === 'in_progress';

  return (
    <aside className="relative w-64 shrink-0 flex flex-col justify-between gap-4 p-4 border-r border-gray-800/80 bg-gradient-to-b from-gray-900/70 to-gray-950/80 select-none">
      {/* Subtle right-edge accent */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      {/* ───────────── Navigation ───────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 -mr-2 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-700">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
          Workspace
        </p>

        <nav aria-label="Main navigation" className="space-y-1">
          {navItems
            .filter((item) => !item.hidden)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`group relative w-full flex items-center justify-between gap-2 pl-2.5 pr-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-blue-600/5 text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border-transparent'
                    }`}
                >
                  {/* Active accent bar */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)] transition-all duration-200 ${isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                      }`}
                  />

                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid place-items-center w-8 h-8 shrink-0 rounded-lg border transition-colors duration-200 ${isActive
                          ? 'bg-blue-500/15 border-blue-500/30'
                          : 'bg-gray-800/60 border-gray-700/60 group-hover:bg-gray-800 group-hover:border-gray-600'
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-200'
                          }`}
                      />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                      <span className="relative flex w-1.5 h-1.5">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
                      </span>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* ───────────── Footer: Current session card ───────────── */}
      {currentSession && (
        <div className="shrink-0 rounded-xl border border-gray-800 bg-gray-900/70 p-3 shadow-inner shadow-black/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Current Session
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${isSessionLive ? 'text-emerald-400' : 'text-amber-400'
                }`}
            >
              <span className="relative flex w-1.5 h-1.5">
                {isSessionLive && (
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex w-1.5 h-1.5 rounded-full ${isSessionLive ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                />
              </span>
              {isSessionLive ? 'In progress' : 'Paused'}
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-200 truncate" title={currentSession.config.targetRole}>
            {currentSession.config.targetRole}
          </p>
          <p
            className="mt-0.5 text-[11px] text-gray-500 truncate"
            title={currentSession.config.targetCompany}
          >
            @ {currentSession.config.targetCompany}
          </p>

          <span className="mt-2.5 inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
            {currentSession.config.mode.replace('_', ' ')}
          </span>
        </div>
      )}
    </aside>
  );
};