import React from 'react';
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
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { InterviewMode } from '../../types/interview';

export const DashboardView: React.FC = () => {
  const { setActiveTab, sessionHistory, loadSession } = useInterviewStore();

  const totalSessions = sessionHistory.length;
  const avgScore = totalSessions > 0
    ? Math.round(
        sessionHistory.reduce((acc, s) => acc + (s.scorecard?.overallScore || 70), 0) / totalSessions
      )
    : 82;

  const modeCards: {
    mode: InterviewMode;
    title: string;
    description: string;
    icon: any;
    color: string;
    tag: string;
  }[] = [
    {
      mode: 'coding',
      title: 'Coding & DSA Interview',
      description: 'Algorithm problem solving with live Monaco code editor, test runner, and Socratic AI hints.',
      icon: Code,
      color: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30 text-blue-400',
      tag: 'Algorithms & Data Structures',
    },
    {
      mode: 'behavioral',
      title: 'Behavioral & Leadership',
      description: 'STAR framework analysis, filler word tracking, leadership principles, and confidence scoring.',
      icon: Users,
      color: 'from-purple-600/20 to-pink-600/10 border-purple-500/30 text-purple-400',
      tag: 'STAR & Communication',
    },
    {
      mode: 'system_design',
      title: 'System Design & Arch',
      description: 'Distributed systems, back-of-envelope calculations, microservices, and database scaling.',
      icon: Layers,
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
      tag: 'High Scale Architecture',
    },
    {
      mode: 'full_mock',
      title: 'Full Loop Simulation',
      description: 'Realistic end-to-end multi-stage interview tailored specifically to your target company and resume.',
      icon: Award,
      color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-400',
      tag: 'Company Specific',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto space-y-8">
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
            Practice voice-to-voice with an AI interviewer calibrated for Google, Meta, Amazon, and top tech companies. Get real-time video telemetry, STAR breakdown, and deep code critiques.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('setup')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/25 cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Interview Readiness</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{avgScore}%</span>
            <span className="text-xs text-emerald-400 font-medium">+5% this week</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgScore}%` }} />
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
            <span className="text-3xl font-bold text-white">84%</span>
            <span className="text-xs text-indigo-400 font-medium">Optimal Big-O</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '84%' }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Eye Contact & Delivery</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">79%</span>
            <span className="text-xs text-purple-400 font-medium">High Confidence</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '79%' }} />
          </div>
        </div>
      </div>

      {/* Select Practice Mode */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Choose Interview Track</h2>
          <p className="text-xs text-gray-400">Select a focused discipline or simulate a full technical loop.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modeCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.mode}
                onClick={() => setActiveTab('setup')}
                className={`group p-6 rounded-2xl bg-gradient-to-br ${card.color} bg-gray-900/90 border transition-all hover:scale-[1.01] hover:border-blue-500/50 cursor-pointer flex flex-col justify-between`}
              >
                <div className="space-y-3">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      {sessionHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Interview Sessions</h2>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 divide-y divide-gray-800 overflow-hidden">
            {sessionHistory.slice(0, 5).map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className="p-4 flex items-center justify-between hover:bg-gray-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white capitalize">
                      {session.config.targetRole} @ {session.config.targetCompany}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {session.config.mode.replace('_', ' ')} • {new Date(session.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

