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
  Loader2,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  Trophy,
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
  const { sessionHistory = [], historyLoading, historyError, loadSession, setActiveTab } = store;

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

  const archiveStats = useMemo(() => {
    const total = sessionHistory.length;
    const scoredSessions = sessionHistory.filter((s) => typeof s.scorecard?.overallScore === 'number');
    const evaluatedCount = scoredSessions.length;

    if (evaluatedCount === 0) {
      return { total, evaluatedCount: 0, avgScore: 0, bestScore: 0 };
    }

    const scores = scoredSessions.map((s) => s.scorecard!.overallScore);
    const sum = scores.reduce((acc, val) => acc + val, 0);
    const avgScore = Math.round(sum / evaluatedCount);
    const bestScore = Math.max(...scores);

    return { total, evaluatedCount, avgScore, bestScore };
  }, [sessionHistory]);

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
    <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-10 lg:py-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              <History className="w-3 h-3" />
              <span>Session Ledger</span>
            </div>
            <h1 className="text-2xl lg:text-[26px] font-bold text-white tracking-tight">
              Interview History & Archives
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Review past mock interview transcripts, hiring recommendations, and feedback reports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-400/60 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>

        {/* Desktop Archive Telemetry Summary (shown when sessions exist) */}
        {sessionHistory.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                  {archiveStats.total}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <History className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400">Evaluated Reports</p>
                <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                  {archiveStats.evaluatedCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                  {archiveStats.evaluatedCount > 0 ? `${archiveStats.avgScore}%` : '—'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400">Peak Performance</p>
                <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                  {archiveStats.evaluatedCount > 0 ? `${archiveStats.bestScore}/100` : '—'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Search & Mode Filter Bar */}
        {sessionHistory.length > 0 && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-gray-900/70 border border-gray-800 p-3.5 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, track, or outcome..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'All Tracks' },
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${selectedMode === tab.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/20'
                        : 'bg-gray-800/70 text-gray-400 border-gray-700/50 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="hidden xl:inline-block text-[11px] font-medium text-gray-500 pl-2 border-l border-gray-800 tabular-nums">
                {filteredSessions.length} of {sessionHistory.length}
              </span>
            </div>
          </div>
        )}

        {/* Session List / Empty States */}
        {historyLoading ? (
          <div className="p-14 text-center rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <h3 className="text-sm font-semibold text-white">Loading Your Interview History...</h3>
            <p className="text-xs text-gray-400">Fetching records from Cloud Firestore.</p>
          </div>
        ) : historyError ? (
          <div className="p-10 text-center rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-semibold text-rose-200">Failed to Load Cloud History</h3>
            <p className="text-xs text-rose-400/80">{historyError}</p>
          </div>
        ) : sessionHistory.length === 0 ? (
          <div className="p-14 text-center rounded-2xl bg-gray-900/50 border border-dashed border-gray-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center mx-auto text-gray-500">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No Interviews Recorded Yet</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Complete your first mock interview session to unlock comprehensive historical metrics
                and scorecards.
              </p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-gray-900/40 border border-dashed border-gray-800 space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">No matching sessions</h3>
            <p className="text-xs text-gray-500">
              Try clearing your search query or switching the interview mode filter.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/75 divide-y divide-gray-800/90 overflow-hidden shadow-lg shadow-black/20">
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
                  className="px-5 py-4 hover:bg-gray-800/45 transition flex items-center justify-between gap-4 cursor-pointer group focus:outline-none focus:bg-gray-800/60"
                >
                  {/* Left: Track Emblem + Role & Metadata */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${meta.badgeClass}`}
                    >
                      <ModeIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition truncate">
                          {session.config?.targetRole || 'Software Engineer'}{' '}
                          <span className="text-gray-500 font-normal">@</span>{' '}
                          {session.config?.targetCompany || 'Tech Company'}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/90 border border-gray-700/80 text-gray-300 font-medium">
                          {meta.label}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {formatDateTime(session.startTime)}
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Scorecard Readout + Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    {session.scorecard ? (
                      <div className="flex items-center gap-3 pr-2 border-r border-gray-800/90">
                        <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-800/90 border border-gray-700/70 text-gray-200">
                          {session.scorecard.recommendation}
                        </span>
                        <div className="text-right min-w-[64px]">
                          <span
                            className={`text-base font-bold tabular-nums ${getScoreColor(
                              session.scorecard.overallScore
                            )}`}
                          >
                            {session.scorecard.overallScore}
                            <span className="text-xs font-medium text-gray-500">/100</span>
                          </span>
                          <p className="sm:hidden text-[10px] font-semibold text-gray-400">
                            {session.scorecard.recommendation}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="pr-2 border-r border-gray-800/90">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-400 border border-gray-700/60">
                          In Progress
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, session.id)}
                          title="Delete session"
                          className="p-2 rounded-xl bg-gray-800/70 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="p-2 rounded-xl bg-gray-800/90 border border-gray-700/60 group-hover:bg-blue-600 group-hover:border-blue-500 text-gray-400 group-hover:text-white transition">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};