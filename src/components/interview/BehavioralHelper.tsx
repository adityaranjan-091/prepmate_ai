import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  RotateCcw,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

interface StarStep {
  letter: 'S' | 'T' | 'A' | 'R';
  title: string;
  desc: string;
  timeHint: string;
  color: string;
  activeColor: string;
}

const STAR_STEPS: StarStep[] = [
  {
    letter: 'S',
    title: 'Situation',
    desc: 'Set the scene. Provide context, company, team, or project challenge (1-2 sentences).',
    timeHint: '~15% of answer',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    activeColor: 'border-emerald-500/50 bg-emerald-950/20',
  },
  {
    letter: 'T',
    title: 'Task',
    desc: 'Clarify what needed to be achieved and your specific responsibility (not just the team).',
    timeHint: '~15% of answer',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    activeColor: 'border-emerald-500/50 bg-emerald-950/20',
  },
  {
    letter: 'A',
    title: 'Action',
    desc: 'Deep dive into what YOU personally designed, coded, resolved, or led. Highlight engineering trade-offs.',
    timeHint: '~50% of answer',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    activeColor: 'border-emerald-500/50 bg-emerald-950/20',
  },
  {
    letter: 'R',
    title: 'Result',
    desc: 'Quantify your impact (e.g. "Reduced P99 latency by 40%", "Saved $120k annually in cloud spend").',
    timeHint: '~20% of answer',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    activeColor: 'border-emerald-500/50 bg-emerald-950/20',
  },
];

export const BehavioralHelper: React.FC = () => {
  const { detectedFillerWordsCount = 0 } = useInterviewStore();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (letter: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [letter]: !prev[letter],
    }));
  };

  const resetChecklist = () => setCompletedSteps({});

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  const fillerStatus =
    detectedFillerWordsCount > 6
      ? {
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        label: 'High — pause instead of using fillers',
      }
      : detectedFillerWordsCount > 3
        ? {
          color: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          label: 'Moderate — stay mindful of pace',
        }
        : {
          color: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Optimal — clear & articulate delivery',
        };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-6 overflow-y-auto shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400 shrink-0" />
            <h2 className="text-base font-bold text-white">
              STAR Method Live Response Guide
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Click each stage as you cover it to keep your behavioral answer structured and concise.
          </p>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={resetChecklist}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-400 hover:text-white transition cursor-pointer shrink-0"
            title="Reset STAR progress for next question"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({completedCount}/4)</span>
          </button>
        )}
      </div>

      {/* STAR Framework Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAR_STEPS.map((step) => {
          const isDone = !!completedSteps[step.letter];
          return (
            <button
              key={step.letter}
              type="button"
              onClick={() => toggleStep(step.letter)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer space-y-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${isDone ? step.activeColor : step.color
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs transition ${isDone
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-gray-900 border-gray-700/60 text-white'
                      }`}
                  >
                    {step.letter}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-900/70 px-2 py-0.5 rounded-md border border-gray-800">
                    {step.timeHint}
                  </span>
                  <CheckCircle2
                    className={`w-4 h-4 transition ${isDone ? 'text-emerald-400 scale-110' : 'text-gray-600'
                      }`}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{step.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Live Verbal Telemetry & Filler Words Monitor */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${fillerStatus.badgeBg}`}
          >
            {detectedFillerWordsCount > 3 ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-white">Filler Word Monitor</h4>
              <span className={`text-[10px] font-medium ${fillerStatus.color}`}>
                • {fillerStatus.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Tracks verbal crutches like &ldquo;um&rdquo;, &ldquo;uh&rdquo;, &ldquo;like&rdquo;, &ldquo;you know&rdquo;, and &ldquo;basically&rdquo;
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-xl font-bold font-mono ${fillerStatus.color}`}>
            {detectedFillerWordsCount}
          </span>
          <p className="text-[10px] text-gray-500">detected so far</p>
        </div>
      </div>

      {/* Golden Rule Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-blue-900/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <MessageSquareQuote className="w-4 h-4 shrink-0" />
          <span>The &ldquo;I&rdquo; vs &ldquo;We&rdquo; Ownership Rule</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Avoid stating only &ldquo;We decided&rdquo; or &ldquo;We built it&rdquo;. Clarify your exact personal ownership:{' '}
          <span className="text-blue-200 italic">
            &ldquo;I architected the event-driven worker in Rust, while my teammate built the React dashboard.&rdquo;
          </span>
        </p>
      </div>
    </div>
  );
};