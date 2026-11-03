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

  return (
    <aside className="w-64 border-r border-gray-800 bg-gray-900/60 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems
            .filter((item) => !item.hidden)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Pro tip footer */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-gray-900 border border-indigo-900/40 text-xs text-gray-300">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
          <span>💡 Interview Tip</span>
        </div>
        <p className="text-gray-400 leading-relaxed text-[11px]">
          Use the <strong className="text-gray-200">STAR</strong> structure: Situation, Task, Action, and quantifiable Result for all behavioral questions.
        </p>
      </div>
    </aside>
  );
};

