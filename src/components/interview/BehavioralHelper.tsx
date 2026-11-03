import React from 'react';
import { Target, CheckCircle2, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const BehavioralHelper: React.FC = () => {
  const { detectedFillerWordsCount } = useInterviewStore();

  const starSteps = [
    {
      letter: 'S',
      title: 'Situation',
      desc: 'Set the scene. Provide context, company, team, or project challenge (1-2 sentences).',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      letter: 'T',
      title: 'Task',
      desc: 'Clarify what needed to be achieved and your specific responsibility (not just the team).',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      letter: 'A',
      title: 'Action',
      desc: 'Deep dive into what YOU personally designed, coded, resolved, or led. Highlight engineering trade-offs.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      letter: 'R',
      title: 'Result',
      desc: 'Quantify your impact (e.g. "Reduced P99 latency by 40%", "Saved $120k annually in cloud spend").',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 rounded-2xl border border-gray-800 p-6 space-y-6 overflow-y-auto shadow-2xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">STAR Method Live Response Guide</h2>
        </div>
        <p className="text-xs text-gray-400">
          Top tech hiring managers evaluate behavioral and leadership answers against this four-part structure.
        </p>
      </div>

      {/* STAR Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {starSteps.map((step) => (
          <div key={step.letter} className={`p-4 rounded-xl border ${step.color} space-y-2`}>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700/60 flex items-center justify-center font-bold text-xs text-white">
                {step.letter}
              </span>
              <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Live Verbal Telemetry & Filler Words Warning */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Filler Word Monitor</h4>
            <p className="text-[11px] text-gray-400">Tracks words like "um", "uh", "like", "you know"</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xl font-bold font-mono ${detectedFillerWordsCount > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {detectedFillerWordsCount}
          </span>
          <p className="text-[10px] text-gray-500">detected so far</p>
        </div>
      </div>

      {/* Golden Rule banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-blue-900/40 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <MessageSquareQuote className="w-4 h-4" />
          <span>The "I" vs "We" Rule</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Avoid stating only "We decided" or "We built it". Clarify your exact role: "I led the architecture design, while my teammate implemented the frontend integration."
        </p>
      </div>
    </div>
  );
};

