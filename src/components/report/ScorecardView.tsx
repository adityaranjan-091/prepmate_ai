import React from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Sparkles,
  Download,
  Share2,
  RotateCcw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';

export const ScorecardView: React.FC = () => {
  const { currentSession, setActiveTab } = useInterviewStore();

  const scorecard = currentSession?.scorecard;

  if (!scorecard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Award className="w-12 h-12 text-gray-600" />
        <h2 className="text-lg font-semibold text-white">No Scorecard Available</h2>
        <p className="text-xs text-gray-400">Complete an interview session to view your comprehensive evaluation.</p>
        <button
          onClick={() => setActiveTab('setup')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer"
        >
          Start Interview
        </button>
      </div>
    );
  }

  const recommendationColor = {
    'Strong Hire': 'from-emerald-600/30 to-teal-600/20 border-emerald-500/40 text-emerald-400',
    'Hire': 'from-blue-600/30 to-cyan-600/20 border-blue-500/40 text-blue-400',
    'Lean Hire': 'from-indigo-600/30 to-blue-600/20 border-indigo-500/40 text-indigo-400',
    'Lean No Hire': 'from-amber-600/30 to-orange-600/20 border-amber-500/40 text-amber-400',
    'No Hire': 'from-red-600/30 to-rose-600/20 border-red-500/40 text-red-400',
  }[scorecard.recommendation] || 'from-blue-600/30 to-indigo-600/20 border-blue-500/40 text-blue-400';

  const handleExportMarkdown = () => {
    const md = `
# Interview Evaluation Report
**Role:** ${currentSession?.config.targetRole} @ ${currentSession?.config.targetCompany}
**Date:** ${new Date(scorecard.timestamp).toLocaleDateString()}
**Overall Recommendation:** ${scorecard.recommendation} (${scorecard.overallScore}/100)

## Executive Summary
${scorecard.summary}

## Category Breakdown
- Technical Accuracy: ${scorecard.categoryScores.technicalAccuracy}%
- Problem Solving: ${scorecard.categoryScores.problemSolving}%
- Communication: ${scorecard.categoryScores.communication}%
- STAR Structure: ${scorecard.categoryScores.starStructure}%
- Confidence & Presence: ${scorecard.categoryScores.confidenceAndPresence}%

## Key Strengths
${scorecard.strengths.map(s => `- ${s}`).join('\n')}

## Areas for Improvement
${scorecard.areasForImprovement.map(a => `- ${a}`).join('\n')}

## Telemetry Summary
- Average Eye Contact: ${scorecard.telemetrySummary.averageEyeContact}%
- Good Posture: ${scorecard.telemetrySummary.goodPosturePercentage}%
- Filler Words Count: ${scorecard.telemetrySummary.fillerWordCount}
    `.trim();

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Interview Debrief & Scorecard
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {currentSession?.config.targetRole} @ {currentSession?.config.targetCompany}
          </h1>
          <p className="text-xs text-gray-400">
            Conducted on {new Date(scorecard.timestamp).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Another</span>
          </button>
        </div>
      </div>

      {/* Hero Recommendation Card */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${recommendationColor} border flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl`}>
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900/60 border border-current text-xs font-bold tracking-wider uppercase">
            <Award className="w-4 h-4" />
            <span>Hiring Decision: {scorecard.recommendation}</span>
          </div>
          <h2 className="text-xl font-bold text-white">Overall Score: {scorecard.overallScore}/100</h2>
          <p className="text-xs text-gray-200 max-w-xl leading-relaxed">
            {scorecard.summary}
          </p>
        </div>

        {/* Large Score Dial */}
        <div className="w-24 h-24 rounded-2xl bg-gray-900/90 border border-gray-700 flex flex-col items-center justify-center shrink-0 shadow-lg">
          <span className="text-3xl font-extrabold text-white">{scorecard.overallScore}</span>
          <span className="text-[10px] text-gray-400 font-semibold uppercase">Score</span>
        </div>
      </div>

      {/* Category Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { label: 'Technical Accuracy', score: scorecard.categoryScores.technicalAccuracy, color: 'bg-blue-500' },
          { label: 'Problem Solving', score: scorecard.categoryScores.problemSolving, color: 'bg-indigo-500' },
          { label: 'Communication', score: scorecard.categoryScores.communication, color: 'bg-purple-500' },
          { label: 'STAR Structure', score: scorecard.categoryScores.starStructure, color: 'bg-emerald-500' },
          { label: 'Confidence & Body', score: scorecard.categoryScores.confidenceAndPresence, color: 'bg-cyan-500' },
        ].map((cat) => (
          <div key={cat.label} className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
            <span className="text-[11px] text-gray-400 font-medium block leading-tight">{cat.label}</span>
            <span className="text-2xl font-bold text-white">{cat.score}%</span>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-white">Demonstrated Strengths</h3>
          </div>
          <div className="space-y-2">
            {scorecard.strengths.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-gray-200">
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-white">Actionable Areas for Improvement</h3>
          </div>
          <div className="space-y-2">
            {scorecard.areasForImprovement.map((a, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-gray-200">
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry & Non-Verbal Breakdown */}
      <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Non-Verbal & Speech Telemetry Summary</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Avg Eye Contact</span>
            </div>
            <p className="text-xl font-bold text-white">{scorecard.telemetrySummary.averageEyeContact}%</p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Good Posture</span>
            </div>
            <p className="text-xl font-bold text-white">{scorecard.telemetrySummary.goodPosturePercentage}%</p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Filler Words</span>
            </div>
            <p className="text-xl font-bold text-white">{scorecard.telemetrySummary.fillerWordCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pace (WPM)</span>
            </div>
            <p className="text-xl font-bold text-white">{scorecard.telemetrySummary.speakingPaceWpm} WPM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

