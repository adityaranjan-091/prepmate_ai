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
  GraduationCap,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { useMCQStore } from '../../store/mcqStore';
import { InterviewMode } from '../../types/interview';

interface ModeCardConfig {
  mode: InterviewMode;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  tag: string;
}

const MODE_CARDS: ModeCardConfig[] = [
  {
    mode: 'coding',
    title: 'Coding & DSA Interview',
    description:
      'Algorithm problem solving with live Monaco code editor, test runner, and Socratic AI hints.',
    icon: Code,
    color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30',
    iconColor: 'text-blue-400',
    tag: 'Algorithms & Data Structures',
  },
  {
    mode: 'behavioral',
    title: 'Behavioral & Leadership',
    description:
      'STAR framework analysis, filler word tracking, leadership principles, and confidence scoring.',
    icon: Users,
    color: 'from-purple-600/20 to-pink-600/10 border-purple-500/30',
    iconColor: 'text-purple-400',
    tag: 'STAR & Communication',
  },
  {
    mode: 'system_design',
    title: 'System Design & Arch',
    description:
      'Distributed systems, back-of-envelope calculations, microservices, and database scaling.',
    icon: Layers,
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    tag: 'High Scale Architecture',
  },
  {
    mode: 'full_mock',
    title: 'Full Loop Simulation',
    description:
      'Realistic end-to-end multi-stage interview tailored specifically to your target company and resume.',
    icon: Award,
    color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30',
    iconColor: 'text-amber-400',
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

const getScoreBadgeClass = (score: number): string => {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
};

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

export const DashboardView: React.FC = () => {
  const setActiveTab = useInterviewStore((state) => state.setActiveTab);
  const sessionHistory = useInterviewStore((state) => state.sessionHistory ?? []);
  const loadSession = useInterviewStore((state) => state.loadSession);

  // Subscribe to MCQ state changes while computing totals via store getters
  const { mcqAttempted, mcqAccuracy } = useMCQStore((state) => ({
    mcqAttempted: state.getTotalAttempted(),
    mcqAccuracy: clampPercent(state.getAccuracyPercent()),
  }));

  const handleSelectMode = (mode?: InterviewMode) => {
    if (mode) {
      const currentStore = useInterviewStore.getState();
      if (
        'updateConfig' in currentStore &&
        typeof currentStore.updateConfig === 'function'
      ) {
        currentStore.updateConfig({ mode });
      } else if (
        'setConfig' in currentStore &&
        typeof currentStore.setConfig === 'function'
      ) {
        currentStore.setConfig({ mode });
      }
    }
    setActiveTab('setup');
  };

  const {
    totalSessions,
    avgScore,
    codingScore,
    codingSessionsCount,
    deliveryScore,
    recentSessions,
  } = useMemo(() => {
    const count = sessionHistory.length;
    if (count === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        codingScore: 0,
        codingSessionsCount: 0,
        deliveryScore: 0,
        recentSessions: [],
      };
    }

    const totalOverall = sessionHistory.reduce(
      (acc, session) => acc + (session.scorecard?.overallScore ?? 0),
      0
    );
    const computedAvg = clampPercent(totalOverall / count);

    const codingSessions = sessionHistory.filter(
      (session) => session.config?.mode === 'coding'
    );
    const computedCoding =
      codingSessions.length > 0
        ? clampPercent(
            codingSessions.reduce(
              (acc, session) => acc + (session.scorecard?.overallScore ?? 0),
              0
            ) / codingSessions.length
          )
        : 0;

    const deliverySessions = sessionHistory.filter(
      (session) =>
        session.config?.mode === 'behavioral' ||
        session.config?.mode === 'full_mock'
    );
    const computedDelivery =
      deliverySessions.length > 0
        ? clampPercent(
            deliverySessions.reduce(
              (acc, session) => acc + (session.scorecard?.overallScore ?? 0),
              0
            ) / deliverySessions.length
          )
        : 0;

    const sortedRecent = [...sessionHistory]
      .sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
      })
      .slice(0, 5);

    return {
      totalSessions: count,
      avgScore: computedAvg,
      codingScore: computedCoding,
      codingSessionsCount: codingSessions.length,
      deliveryScore: computedDelivery,
      recentSessions: sortedRecent,
    };
  }, [sessionHistory]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-10 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* Hero Welcome & Quick Action */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 p-6 lg:p-8">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium select-none">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>AI Interview Readiness Platform</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Master Your Next Tech Interview
              </h1>

              <p className="text-gray-300 text-sm leading-relaxed">
                Practice voice-to-voice with an AI interviewer calibrated for Google, Meta, Amazon,
                and top tech companies. Get real-time video telemetry, STAR breakdown, and deep code
                critiques.
              </p>

              <div className="pt-1.5 flex flex-wrap items-center gap-3 select-none">
                <button
                  type="button"
                  onClick={() => handleSelectMode()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start New Mock Interview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('core_cs')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 hover:border-cyan-500/40 border border-gray-700 active:scale-[0.99] text-gray-200 hover:text-white font-medium text-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                >
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>Practice Core CS &amp; OA</span>
                </button>
              </div>
            </div>

            {/* Desktop Calibration Highlights Card */}
            <div className="hidden lg:flex flex-col justify-between gap-3 w-80 shrink-0 p-4 rounded-xl bg-gray-950/50 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                <span>Evaluation Engine</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Communication &amp; STAR</span>
                  <span className="font-semibold text-purple-300 tabular-nums">
                    {deliveryScore > 0 ? `${deliveryScore}% Avg` : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-800/80">
                  <span className="text-gray-400">Code &amp; Complexity</span>
                  <span className="font-semibold text-blue-300 tabular-nums">
                    {codingSessionsCount > 0 ? `${codingScore}% Avg` : 'Live Sandbox'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-gray-400">CS Fundamentals</span>
                  <span className="font-semibold text-cyan-300 tabular-nums">
                    {mcqAttempted > 0 ? `${mcqAccuracy}% (${mcqAttempted})` : 'OA Bank'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ambient glow */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        </section>

        {/* Metrics Row */}
        <section
          aria-label="Performance metrics"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Interview Readiness</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {avgScore}%
                </span>
                <span className="text-[11px] text-emerald-400 font-medium truncate">
                  {totalSessions > 0 ? `${totalSessions} mocks evaluated` : 'No sessions yet'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Interview readiness score"
                aria-valuenow={avgScore}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden"
              >
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Interviews Completed</span>
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {totalSessions}
                </span>
                <span className="text-[11px] text-gray-400">sessions recorded</span>
              </div>
              <p className="text-[11px] text-gray-500">Cloud synced to your account</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Coding Proficiency</span>
              <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Code className="w-4 h-4 text-indigo-400" />
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {codingScore}%
                </span>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {codingSessionsCount > 0 ? `${codingSessionsCount} evaluated` : 'Pending mock'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Coding proficiency score"
                aria-valuenow={codingScore}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden"
              >
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${codingScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">OA &amp; Core CS Accuracy</span>
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-400" />
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {mcqAccuracy}%
                </span>
                <span className="text-[11px] text-purple-400 font-medium">
                  {mcqAttempted > 0 ? `${mcqAttempted} answered` : 'No attempts yet'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="OA and Core CS accuracy"
                aria-valuenow={mcqAccuracy}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden"
              >
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${mcqAccuracy}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Split Workspace: Tracks (Left) + Recent Sessions (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Select Practice Mode (7 Cols) */}
          <section className="xl:col-span-7 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Choose Interview Track
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select a focused discipline or simulate a full technical loop.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.mode}
                    type="button"
                    onClick={() => handleSelectMode(card.mode)}
                    className={`group text-left p-5 rounded-2xl bg-gradient-to-br ${card.color} bg-gray-900/90 border transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-black/30 cursor-pointer flex flex-col justify-between min-h-[196px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none`}
                  >
                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-900/80 border border-gray-700/70 text-gray-300">
                          {card.tag}
                        </span>
                        <span className="w-8 h-8 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center justify-center shrink-0">
                          <Icon
                            className={`w-4 h-4 ${card.iconColor} group-hover:scale-110 transition-transform`}
                          />
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-white tracking-tight">
                          {card.title}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">{card.description}</p>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-800/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition">
                      <span>Start Practice</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recent Sessions (5 Cols) */}
          <section className="xl:col-span-5 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Recent Interview Sessions
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Review completed scorecards and past evaluations.
                </p>
              </div>
              {sessionHistory.length > 5 && (
                <span className="text-[11px] font-medium text-gray-400">
                  Latest 5 of {sessionHistory.length}
                </span>
              )}
            </div>

            {recentSessions.length > 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/70 divide-y divide-gray-800/90 overflow-hidden">
                {recentSessions.map((session) => {
                  const score = session.scorecard?.overallScore;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => loadSession(session.id)}
                      className="group w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-800/50 transition cursor-pointer text-left focus:outline-none focus:bg-gray-800/60"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition">
                            {session.config?.targetRole || 'Software Engineer'} @{' '}
                            {session.config?.targetCompany || 'Top Tech'}
                          </h4>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>{formatModeLabel(session.config?.mode || 'coding')}</span>
                            <span className="text-gray-600">•</span>
                            <span>{formatSessionDate(session.startTime)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {session.scorecard && typeof score === 'number' && (
                          <div className="text-right">
                            <span
                              className={`text-xs font-bold tabular-nums ${getScoreBadgeClass(
                                score
                              )}`}
                            >
                              {score}/100
                            </span>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {session.scorecard.recommendation}
                            </p>
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-8 text-center flex flex-col items-center justify-center min-h-[260px] space-y-3.5">
                <div className="w-11 h-11 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-200">No interview sessions yet</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Complete your first mock interview to unlock detailed scorecards, STAR
                    breakdowns, and progress tracking across sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectMode()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-blue-400 hover:text-blue-300 transition cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <span>Start your first mock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};