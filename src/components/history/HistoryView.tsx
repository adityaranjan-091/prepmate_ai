import React from 'react';
import { History, Calendar, Award, ArrowRight, Code, Users, Layers } from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const HistoryView: React.FC = () => {
  const { sessionHistory, loadSession, setActiveTab } = useInterviewStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interview History & Archives</h1>
          <p className="text-xs text-gray-400">
            Review past mock interview transcripts, hiring recommendations, and feedback reports.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('setup')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
        >
          New Session
        </button>
      </div>

      {sessionHistory.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
          <History className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Interviews Recorded Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Complete your first mock interview session to unlock comprehensive historical metrics and scorecards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sessionHistory.map((session) => (
            <div
              key={session.id}
              onClick={() => loadSession(session.id)}
              className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  {session.config.mode === 'coding' ? (
                    <Code className="w-6 h-6" />
                  ) : session.config.mode === 'behavioral' ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    <Layers className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                      {session.config.targetRole} @ {session.config.targetCompany}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 capitalize">
                      {session.config.mode.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(session.startTime).toLocaleString()}</span>
                    <span>• {session.messages.length} messages</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {session.scorecard && (
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400">
                      {session.scorecard.overallScore}/100
                    </span>
                    <p className="text-[11px] font-semibold text-gray-300">
                      {session.scorecard.recommendation}
                    </p>
                  </div>
                )}
                <div className="p-2 rounded-xl bg-gray-800 group-hover:bg-blue-600 text-gray-400 group-hover:text-white transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

