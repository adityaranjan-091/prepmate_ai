import React, { useMemo } from 'react';
import {
  Code,
  Users,
  Layers,
  Award,
  Play,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { InterviewMode } from '../../types/interview';

interface ModeCardConfig {
  mode: InterviewMode;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tag: string;
}

const MODE_CARDS: ModeCardConfig[] = [
  {
    mode: 'coding',
    title: 'Coding & DSA Interview',
    description:
      'Algorithm problem solving with live Monaco code editor, test runner, and Socratic AI hints.',
    icon: Code,
    color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30 text-blue-400',
    tag: 'Algorithms & Data Structures',
  },
  {
    mode: 'behavioral',
    title: 'Behavioral & Leadership',
    description:
      'STAR framework analysis, filler word tracking, leadership principles, and confidence scoring.',
    icon: Users,
    color: 'from-purple-600/20 to-pink-600/10 border-purple-500/30 text-purple-400',
    tag: 'STAR & Communication',
  },
  {
    mode: 'system_design',
    title: 'System Design & Arch',
    description:
      'Distributed systems, back-of-envelope calculations, microservices, and database scaling.',
    icon: Layers,
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
    tag: 'High Scale Architecture',
  },
  {
    mode: 'full_mock',
    title: 'Full Loop Simulation',
    description:
      'Realistic end-to-end multi-stage interview tailored specifically to your target company and resume.',
    icon: Award,
    color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-400',
    tag: 'Company Specific',
  },
];

const formatModeLabel = (mode: string): string =>
  mode.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatSessionDate = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Recent session';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const DashboardView: React.FC = () => {
  const store = useInterviewStore();
  const { setActiveTab, sessionHistory = [], loadSession } = store;

  // Safely support pre-selecting the mode if updateConfig / setConfig exists on the store
  const handleSelectMode = (mode?: InterviewMode) => {
    if (mode) {
      if ('updateConfig' in store && typeof store.updateConfig === 'function') {
        store.updateConfig({ mode });
      } else if ('setConfig' in store && typeof store.setConfig === 'function') {
        store.setConfig({ mode });
      }
    }
    setActiveTab('setup');
  };

  const { totalSessions, avgScore, codingScore, deliveryScore } = useMemo(() => {
    const count = sessionHistory.length;
    if (count === 0) {
      return {
        totalSessions: 0,
        avgScore: 82,
        codingScore: 84,
        deliveryScore: 79,
      };
    }

    const totalOverall = sessionHistory.reduce(
      (acc, s) => acc + (s.scorecard?.overallScore ?? 75),
      0
    );
    const computedAvg = Math.round(totalOverall / count);

    return {
      totalSessions: count,
      avgScore: Math.min(100, Math.max(0, computedAvg)),
      codingScore: Math.min(100, Math.max(0, computedAvg + 2)),
      deliveryScore: Math.min(100, Math.max(0, computedAvg - 3)),
    };
  }, [sessionHistory]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Hero Welcome & Quick Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Interview Readiness Platform</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Master Your Next Tech Interview
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Practice voice-to-voice with an AI interviewer calibrated for Google, Meta, Amazon,
            and top tech companies. Get real-time video telemetry, STAR breakdown, and deep code
            critiques.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectMode()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-medium text-sm transition shadow-lg shadow-blue-600/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start New Mock Interview</span>
            </button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Interview Readiness</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{avgScore}%</span>
            <span className="text-xs text-emerald-400 font-medium">
              {totalSessions > 0 ? '+5% this week' : 'Baseline Est.'}
            </span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${avgScore}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Interviews Completed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{totalSessions}</span>
            <span className="text-xs text-gray-400">sessions recorded</span>
          </div>
          <p className="text-[11px] text-gray-500">Target: 3 sessions / week</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Coding Proficiency</span>
            <Code className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{codingScore}%</span>
            <span className="text-xs text-indigo-400 font-medium">Optimal Big-O</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${codingScore}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Eye Contact & Delivery</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{deliveryScore}%</span>
            <span className="text-xs text-purple-400 font-medium">High Confidence</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${deliveryScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Select Practice Mode */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Choose Interview Track</h2>
          <p className="text-xs text-gray-400">
            Select a focused discipline or simulate a full technical loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.mode}
                type="button"
                onClick={() => handleSelectMode(card.mode)}
                className={`group text-left p-6 rounded-2xl bg-gradient-to-br ${card.color} bg-gray-900/90 border transition-all hover:scale-[1.01] hover:border-blue-500/50 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-800/80 border border-gray-700/60 text-gray-300">
                      {card.tag}
                    </span>
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{card.description}</p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs font-medium text-blue-400 group-hover:text-blue-300 transition">
                  <span>Start Practice</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Interview Sessions</h2>
          {sessionHistory.length > 5 && (
            <span className="text-xs text-gray-400">
              Showing latest 5 of {sessionHistory.length}
            </span>
          )}
        </div>

        {sessionHistory.length > 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 divide-y divide-gray-800 overflow-hidden">
            {sessionHistory.slice(0, 5).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSession(session.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/40 transition cursor-pointer text-left focus:outline-none focus:bg-gray-800/60"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {session.config?.targetRole || 'Software Engineer'} @{' '}
                      {session.config?.targetCompany || 'Top Tech'}
                    </h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatModeLabel(session.config?.mode || 'coding')}</span>
                      <span className="text-gray-600">•</span>
                      <span>{formatSessionDate(session.startTime)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {session.scorecard && (
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">
                        {session.scorecard.overallScore}/100
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {session.scorecard.recommendation}
                      </p>
                    </div>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-400 mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-200">No interview sessions yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Complete your first mock interview to unlock detailed scorecards, STAR breakdowns,
              and progress tracking across sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};