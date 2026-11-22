import React from 'react';
import {
  LayoutDashboard,
  Video,
  Code2,
  FileText,
  History,
  Sliders,
  GraduationCap,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentSession } = useInterviewStore();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      group: 'workspace',
    },
    {
      id: 'core_cs',
      label: 'Core CS & OA Prep',
      icon: GraduationCap,
      group: 'workspace',
    },
    {
      id: 'setup',
      label: 'AI Mock Interview',
      icon: Video,
      badge: currentSession?.status === 'in_progress' ? 'LIVE' : undefined,
      group: 'workspace',
    },
    {
      id: 'interview',
      label: 'Interview Studio',
      icon: Code2,
      hidden: !currentSession,
      group: 'workspace',
    },
    {
      id: 'report',
      label: 'Scorecard',
      icon: FileText,
      hidden: !currentSession?.scorecard,
      group: 'workspace',
    },
    {
      id: 'history',
      label: 'History & Analytics',
      icon: History,
      group: 'system',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Sliders,
      group: 'system',
    },
  ];

  const isSessionLive = currentSession?.status === 'in_progress';
  const visibleItems = navItems.filter((item) => !item.hidden);
  const workspaceItems = visibleItems.filter((item) => item.group === 'workspace');
  const systemItems = visibleItems.filter((item) => item.group === 'system');

  const renderNavButton = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id as any)}
        aria-current={isActive ? 'page' : undefined}
        title={item.label}
        className={`group relative w-full flex items-center justify-between gap-2.5 pl-3 pr-2.5 py-2 rounded-xl border text-[13px] font-medium transition-all duration-150 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${isActive
            ? 'bg-gradient-to-r from-blue-600/20 via-blue-600/10 to-transparent text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10'
            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 border-transparent'
          }`}
      >
        {/* Left active rail */}
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.75)] transition-all duration-150 ${isActive ? 'h-4 opacity-100' : 'h-0 opacity-0'
            }`}
        />

        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`grid place-items-center w-7 h-7 shrink-0 rounded-lg border transition-colors duration-150 ${isActive
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-gray-900/90 border-gray-800 text-gray-400 group-hover:bg-gray-800 group-hover:border-gray-700 group-hover:text-gray-200'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
          <span className="truncate tracking-tight">{item.label}</span>
        </div>

        {item.badge && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
            </span>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="relative w-64 shrink-0 flex flex-col justify-between gap-4 px-3.5 py-5 border-r border-gray-800/80 bg-gradient-to-b from-gray-900/75 to-gray-950/90 select-none">
      {/* Subtle right-edge hairline highlight */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />

      {/* ───────────── Navigation ───────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 -mr-1.5 pr-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-700">
        {/* Primary Workspace Group */}
        <div className="space-y-1.5">
          <div className="px-2.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Practice
            </p>
          </div>
          <nav aria-label="Practice navigation" className="space-y-1">
            {workspaceItems.map(renderNavButton)}
          </nav>
        </div>

        {/* Divider */}
        <div className="mx-2 border-t border-gray-800/80" />

        {/* Secondary System Group */}
        <div className="space-y-1.5">
          <div className="px-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Insights & System
            </p>
          </div>
          <nav aria-label="System navigation" className="space-y-1">
            {systemItems.map(renderNavButton)}
          </nav>
        </div>
      </div>

      {/* ───────────── Footer: Current session indicator ───────────── */}
      {currentSession && (
        <div className="shrink-0 pt-2 border-t border-gray-800/70">
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-3.5 shadow-inner shadow-black/25 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Active Session
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isSessionLive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
                {isSessionLive ? 'Live' : 'Paused'}
              </span>
            </div>

            <div className="space-y-0.5">
              <p
                className="text-xs font-semibold text-gray-100 truncate"
                title={currentSession.config.targetRole}
              >
                {currentSession.config.targetRole}
              </p>
              <p
                className="text-[11px] text-gray-400 truncate"
                title={currentSession.config.targetCompany}
              >
                @ {currentSession.config.targetCompany}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-gray-800/80">
              <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-800/90 border border-gray-700/80 text-gray-300">
                {currentSession.config.mode.replace('_', ' ')}
              </span>
              {activeTab !== 'interview' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('interview')}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  Resume &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};