import React, { useMemo, useState } from 'react';
import {
  History,
  Calendar,
  Award,
  ArrowRight,
  Code,
  Users,
  Layers,
  Search,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { InterviewMode } from '../../types/interview';

type FilterMode = 'all' | InterviewMode;

const MODE_META: Record<
  string,
  {
    label: string;
    icon: React.FC<{ className?: string }>;
    badgeClass: string;
  }
> = {
  coding: {
    label: 'Coding & DSA',
    icon: Code,
    badgeClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  behavioral: {
    label: 'Behavioral',
    icon: Users,
    badgeClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  system_design: {
    label: 'System Design',
    icon: Layers,
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  full_mock: {
    label: 'Full Loop',
    icon: Award,
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
};

const formatDateTime = (value: string | number | Date): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-amber-400';
  return 'text-rose-400';
};

export const HistoryView: React.FC = () => {
  const store = useInterviewStore();
  const { sessionHistory = [], loadSession, setActiveTab } = store;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<FilterMode>('all');

  // Optional support if deleteSession exists in your store
  const canDelete = 'deleteSession' in store && typeof store.deleteSession === 'function';

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (canDelete) {
      (store as unknown as { deleteSession: (id: string) => void }).deleteSession(sessionId);
    }
  };

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...sessionHistory]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .filter((session) => {
        const mode = session.config?.mode || 'coding';
        const matchesMode = selectedMode === 'all' || mode === selectedMode;

        if (!matchesMode) return false;
        if (!query) return true;

        const role = (session.config?.targetRole || '').toLowerCase();
        const company = (session.config?.targetCompany || '').toLowerCase();
        const recommendation = (session.scorecard?.recommendation || '').toLowerCase();

        return (
          role.includes(query) ||
          company.includes(query) ||
          mode.replace('_', ' ').includes(query) ||
          recommendation.includes(query)
        );
      });
  }, [sessionHistory, searchQuery, selectedMode]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Interview History & Archives
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review past mock interview transcripts, hiring recommendations, and feedback reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('setup')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Search & Mode Filter Bar (shown when there is at least 1 session) */}
      {sessionHistory.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-900/60 border border-gray-800 p-3 rounded-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or outcome..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'coding', label: 'Coding' },
                { id: 'behavioral', label: 'Behavioral' },
                { id: 'system_design', label: 'System Design' },
                { id: 'full_mock', label: 'Full Loop' },
              ] as { id: FilterMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${selectedMode === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session List / Empty States */}
      {sessionHistory.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
          <History className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Interviews Recorded Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Complete your first mock interview session to unlock comprehensive historical metrics
            and scorecards.
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-gray-900/40 border border-dashed border-gray-800 space-y-2">
          <h3 className="text-sm font-semibold text-gray-200">No matching sessions</h3>
          <p className="text-xs text-gray-500">
            Try clearing your search query or switching the interview mode filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredSessions.map((session) => {
            const modeKey = session.config?.mode || 'coding';
            const meta = MODE_META[modeKey] || MODE_META.coding;
            const ModeIcon = meta.icon;
            const messageCount = session.messages?.length ?? 0;

            return (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => loadSession(session.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadSession(session.id);
                  }
                }}
                className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition flex items-center justify-between gap-4 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center ${meta.badgeClass}`}
                  >
                    <ModeIcon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition truncate">
                        {session.config?.targetRole || 'Software Engineer'} @{' '}
                        {session.config?.targetCompany || 'Tech Company'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 font-medium">
                        {meta.label}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {formatDateTime(session.startTime)}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                        {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {session.scorecard ? (
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${getScoreColor(
                          session.scorecard.overallScore
                        )}`}
                      >
                        {session.scorecard.overallScore}/100
                      </span>
                      <p className="text-[11px] font-semibold text-gray-300">
                        {session.scorecard.recommendation}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-400 border border-gray-700/60">
                      In Progress
                    </span>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, session.id)}
                      title="Delete session"
                      className="p-2 rounded-xl bg-gray-800/60 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="p-2 rounded-xl bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white transition">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};