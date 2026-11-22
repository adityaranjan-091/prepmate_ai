import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Cpu,
  Database,
  Globe,
  Box,
  Binary,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  Bookmark,
  RotateCcw,
  Search,
  ArrowRight,
  ArrowLeft,
  Award,
  Loader2,
} from 'lucide-react';
import { CORE_CS_QUESTIONS } from '../../data/coreCsQuestions';
import { CSSubject, MCQQuestion } from '../../types/mcq';
import { useInterviewStore } from '../../store/interviewStore';
import { useMCQStore } from '../../store/mcqStore';

type PracticeMode = 'practice' | 'assessment';

export const CoreCsPracticeView: React.FC = () => {
  const { aiService } = useInterviewStore();
  const {
    answers: userAnswers,
    bookmarks: bookmarkedIds,
    recordAnswer,
    toggleBookmark,
    resetProgress,
    isLoading: mcqLoading,
  } = useMCQStore();

  const [selectedSubject, setSelectedSubject] = useState<'All' | CSSubject>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('practice');

  // Question navigation in current view
  const [currentIndex, setCurrentIndex] = useState(0);

  // Local answers state for timed assessment mode
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});

  // AI explanation state for tricky concepts
  const [aiExplanations, setAiExplanations] = useState<Record<string, { loading: boolean; text?: string }>>({});

  // Timed Assessment state
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [assessmentSecondsLeft, setAssessmentSecondsLeft] = useState(1200); // 20 mins
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return CORE_CS_QUESTIONS.filter((q) => {
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
      if (onlyBookmarked && !bookmarkedIds.has(q.id)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesTags = q.companyTags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTopic && !matchesQuestion && !matchesTags) return false;
      }
      return true;
    });
  }, [selectedSubject, selectedDifficulty, onlyBookmarked, bookmarkedIds, searchQuery]);

  // Keep index in bounds when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedSubject, selectedDifficulty, onlyBookmarked, searchQuery]);

  // Assessment timer
  useEffect(() => {
    if (!isAssessmentActive || assessmentSubmitted) return;
    const interval = setInterval(() => {
      setAssessmentSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAssessmentSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAssessmentActive, assessmentSubmitted]);

  const activeAnswers = mode === 'assessment' ? assessmentAnswers : userAnswers;

  const currentQ: MCQQuestion | undefined = filteredQuestions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ) return;
    if (mode === 'assessment') {
      if (assessmentSubmitted) return;
      setAssessmentAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionIndex,
      }));
    } else {
      recordAnswer(currentQ.id, optionIndex, currentQ.correctIndex, currentQ.subject);
    }
  };

  const handleAskAIExplanation = async (q: MCQQuestion) => {
    if (aiExplanations[q.id]?.text || aiExplanations[q.id]?.loading) return;

    setAiExplanations((prev) => ({
      ...prev,
      [q.id]: { loading: true },
    }));

    const prompt = `You are a Principal Software Engineer tutoring a candidate on a Core Computer Science Online Assessment MCQ.
Question: "${q.question}"
Correct Answer: "${q.options[q.correctIndex]}"
Context & Subject: ${q.subject} - ${q.topic}

Provide a concise, ultra-clear explanation (under 120 words) breaking down:
1. The fundamental intuition behind this concept.
2. Why the correct answer is true.
3. A memorable rule-of-thumb to remember for technical interviews.`;

    try {
      const explanation = await aiService.generateText(prompt);
      setAiExplanations((prev) => ({
        ...prev,
        [q.id]: { loading: false, text: explanation },
      }));
    } catch {
      setAiExplanations((prev) => ({
        ...prev,
        [q.id]: { loading: false, text: q.explanation },
      }));
    }
  };

  // Global score statistics
  const stats = useMemo(() => {
    const currentMap = mode === 'assessment' ? assessmentAnswers : userAnswers;
    let attempted = 0;
    let correct = 0;
    CORE_CS_QUESTIONS.forEach((q) => {
      if (currentMap[q.id] !== undefined) {
        attempted++;
        if (currentMap[q.id] === q.correctIndex) {
          correct++;
        }
      }
    });
    const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { attempted, correct, percentage };
  }, [userAnswers, assessmentAnswers, mode]);

  const resetAllProgress = () => {
    if (window.confirm('Reset all answers and practice metrics?')) {
      resetProgress();
      setAssessmentAnswers({});
      setAssessmentSubmitted(false);
      setIsAssessmentActive(false);
      setAssessmentSecondsLeft(1200);
    }
  };

  const subjectTabs = [
    { id: 'All', label: 'All Subjects', icon: GraduationCap },
    { id: 'Operating Systems' as CSSubject, label: 'Operating Systems', icon: Cpu },
    { id: 'DBMS & SQL' as CSSubject, label: 'DBMS & SQL', icon: Database },
    { id: 'Computer Networks' as CSSubject, label: 'Computer Networks', icon: Globe },
    { id: 'OOP & Design' as CSSubject, label: 'OOP & Design', icon: Box },
    { id: 'DSA & Complexity' as CSSubject, label: 'DSA Theory', icon: Binary },
  ];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredInFilteredCount = filteredQuestions.filter(
    (q) => activeAnswers[q.id] !== undefined
  ).length;
  const filteredCompletionPct =
    filteredQuestions.length > 0
      ? Math.round((answeredInFilteredCount / filteredQuestions.length) * 100)
      : 0;

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth bg-gray-950 px-6 py-7 lg:px-10 lg:py-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* ───────────── Top Desktop Command Header ───────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-900/75 border border-gray-800 rounded-2xl px-6 py-5 shadow-lg">
          <div className="flex items-start sm:items-center gap-4">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                  Core CS &amp; OA Question Bank
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 tabular-nums">
                  {CORE_CS_QUESTIONS.length} Questions
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Master OS, DBMS, Networks, OOP, and Algorithm theory tested in top company Online Assessments.
              </p>
            </div>
          </div>

          {/* Right Controls: Telemetry Pill + Mode Switcher + Reset */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Global Progress Metrics */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-gray-950/90 border border-gray-800 text-xs">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  Accuracy
                </p>
                <p className="font-bold text-emerald-400 font-mono tabular-nums text-sm">
                  {stats.percentage}%
                </p>
              </div>
              <div className="h-7 w-px bg-gray-800" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  Solved
                </p>
                <p className="font-bold text-white font-mono tabular-nums text-sm">
                  {stats.correct}{' '}
                  <span className="text-gray-500 font-normal">/ {stats.attempted}</span>
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-gray-950/90 p-1 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setMode('practice');
                  setIsAssessmentActive(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${mode === 'practice'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Practice Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('assessment');
                  setIsAssessmentActive(true);
                  setAssessmentSubmitted(false);
                  setAssessmentSecondsLeft(1200);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${mode === 'assessment'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timed OA</span>
              </button>
            </div>

            <button
              type="button"
              onClick={resetAllProgress}
              title="Reset progress"
              className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/80 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ───────────── Filter & Search Bar ───────────── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-gray-900/45 border border-gray-800/80 rounded-2xl px-4 py-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {subjectTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedSubject === tab.id;
              const count =
                tab.id === 'All'
                  ? CORE_CS_QUESTIONS.length
                  : CORE_CS_QUESTIONS.filter((q) => q.subject === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSubject(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 whitespace-nowrap cursor-pointer ${isActive
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                      : 'bg-gray-900/70 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-gray-500 font-mono tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters: Search & Difficulty & Bookmark */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or company..."
                className="pl-8 pr-3 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 w-full sm:w-52 transition-all duration-200"
              />
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="bg-gray-950/80 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500/60 cursor-pointer transition-all duration-200"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <button
              type="button"
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${onlyBookmarked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-gray-950/80 border-gray-800 text-gray-400 hover:text-white'
                }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarkedIds.size})</span>
            </button>
          </div>
        </div>

        {/* ───────────── Timed OA Banner ───────────── */}
        {mode === 'assessment' && !assessmentSubmitted && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs">
            <div className="flex items-center gap-2.5 text-purple-300">
              <Clock className="w-4 h-4 animate-pulse text-purple-400" />
              <span className="font-semibold">Timed Online Assessment (OA) Simulation</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm font-bold text-purple-200 tabular-nums">
                Time Left: {formatTimer(assessmentSecondsLeft)}
              </span>
              <button
                type="button"
                onClick={() => setAssessmentSubmitted(true)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all duration-200 cursor-pointer"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* ───────────── Assessment Completed Scorecard ───────────── */}
        {mode === 'assessment' && assessmentSubmitted ? (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-2xl border border-gray-800 space-y-6 text-center max-w-xl mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 grid place-items-center text-white shadow-xl shadow-purple-600/30 ring-1 ring-white/20">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Assessment Evaluation Complete
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Here is how you scored on the Core CS Online Assessment round.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full font-mono">
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Score</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
                  {stats.correct} / {filteredQuestions.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Accuracy</p>
                <p className="text-xl font-bold text-blue-400 tabular-nums mt-0.5">
                  {stats.percentage}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Outcome</p>
                <p className="text-xs font-semibold text-purple-300 mt-1.5">
                  {stats.percentage >= 75 ? 'Qualified (Pass)' : 'Needs Revision'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('practice');
                  setAssessmentSubmitted(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all duration-200 cursor-pointer"
              >
                Review Explanations in Practice Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssessmentAnswers({});
                  setAssessmentSubmitted(false);
                  setAssessmentSecondsLeft(1200);
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-all duration-200 cursor-pointer"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-900/40 rounded-2xl border border-dashed border-gray-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-200">
                No questions match your current filters
              </h3>
              <p className="text-xs text-gray-500">
                Try clearing the search query or selecting "All Subjects".
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('All');
                setSelectedDifficulty('All');
                setSearchQuery('');
                setOnlyBookmarked(false);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* ───────────── Flowing Two-Column Desktop Layout ───────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Flowing Question Workspace (8-9 Cols) */}
            <div className="lg:col-span-8 xl:col-span-9 bg-gray-900/45 border border-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
              {currentQ && (
                <>
                  <div className="p-6 lg:p-8 space-y-6">
                    {/* Question Header & Meta Badges */}
                    <div className="flex items-start justify-between gap-4 border-b border-gray-800/80 pb-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                            {currentQ.subject}
                          </span>
                          <span className="text-[11px] font-medium text-gray-300 bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded-md">
                            {currentQ.topic}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${currentQ.difficulty === 'Easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : currentQ.difficulty === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                          >
                            {currentQ.difficulty}
                          </span>
                        </div>

                        {/* Company Tags */}
                        {currentQ.companyTags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                            <span>Asked at:</span>
                            {currentQ.companyTags.map((company) => (
                              <span
                                key={company}
                                className="px-2 py-0.5 rounded bg-gray-900/90 border border-gray-800 text-gray-400 font-medium"
                              >
                                {company}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => toggleBookmark(currentQ.id)}
                        className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer shrink-0 ${bookmarkedIds.has(currentQ.id)
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white hover:border-gray-700'
                          }`}
                        title={bookmarkedIds.has(currentQ.id) ? 'Remove bookmark' : 'Bookmark question'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 shrink-0 mt-0.5">
                          Q{currentIndex + 1}
                        </span>
                        <h2 className="text-base lg:text-[17px] font-semibold text-white leading-relaxed select-text">
                          {currentQ.question}
                        </h2>
                      </div>

                      {/* Optional Code Snippet */}
                      {currentQ.codeSnippet && (
                        <div className="p-4 rounded-xl bg-gray-950/90 border border-gray-800 font-mono text-xs text-gray-200 overflow-x-auto select-text whitespace-pre leading-relaxed">
                          {currentQ.codeSnippet}
                        </div>
                      )}
                    </div>

                    {/* 4 Interactive Options */}
                    <div className="space-y-3">
                      {currentQ.options.map((option, idx) => {
                        const optionLetter = String.fromCharCode(65 + idx);
                        const isSelected = activeAnswers[currentQ.id] === idx;
                        const isAnswered = activeAnswers[currentQ.id] !== undefined;
                        const isCorrect = idx === currentQ.correctIndex;

                        let optionClass =
                          'bg-gray-900/70 border-gray-800 text-gray-200 hover:border-gray-700 hover:bg-gray-900';
                        let letterClass = 'bg-gray-800/90 text-gray-400 border-gray-700';

                        if (mode === 'practice' && isAnswered) {
                          if (isCorrect) {
                            optionClass = 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200';
                            letterClass = 'bg-emerald-600 text-white border-emerald-500';
                          } else if (isSelected && !isCorrect) {
                            optionClass = 'bg-red-950/30 border-red-500/50 text-red-200';
                            letterClass = 'bg-red-600 text-white border-red-500';
                          }
                        } else if (isSelected) {
                          optionClass = 'bg-blue-600/15 border-blue-500 text-white';
                          letterClass = 'bg-blue-600 text-white border-blue-500';
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectOption(idx)}
                            className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left text-xs sm:text-[13px] transition-all duration-200 cursor-pointer ${optionClass}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg border font-mono font-bold text-[11px] grid place-items-center shrink-0 transition-colors duration-200 ${letterClass}`}
                            >
                              {optionLetter}
                            </span>
                            <span className="flex-1 pt-0.5 leading-relaxed">{option}</span>
                            {mode === 'practice' && isAnswered && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            {mode === 'practice' && isAnswered && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Practice Mode: In-depth Explanation Card */}
                    {mode === 'practice' && activeAnswers[currentQ.id] !== undefined && (
                      <div className="p-5 rounded-xl bg-gray-900/95 border border-gray-800 space-y-3.5 transition-all duration-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                          <div className="flex items-center gap-2">
                            {activeAnswers[currentQ.id] === currentQ.correctIndex ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Correct!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                <XCircle className="w-4 h-4" />
                                <span>
                                  Incorrect — Option {String.fromCharCode(65 + currentQ.correctIndex)}{' '}
                                  is the right answer
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Ask AI Explanation Button */}
                          <button
                            type="button"
                            onClick={() => handleAskAIExplanation(currentQ)}
                            disabled={aiExplanations[currentQ.id]?.loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all duration-200 cursor-pointer"
                          >
                            {aiExplanations[currentQ.id]?.loading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span>Ask AI to Break Down</span>
                          </button>
                        </div>

                        <div className="space-y-3 text-xs sm:text-[13px] text-gray-300 leading-relaxed select-text">
                          <p>{currentQ.explanation}</p>
                          {currentQ.keyTakeaway && (
                            <div className="p-3 rounded-lg bg-blue-950/25 border border-blue-900/40 text-blue-300 text-xs font-medium">
                              <strong>Key Interview Rule:</strong> {currentQ.keyTakeaway}
                            </div>
                          )}

                          {/* AI Generated In-depth Breakdown if requested */}
                          {aiExplanations[currentQ.id]?.text && (
                            <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs space-y-1.5 transition-all duration-200">
                              <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Socratic Concept Insight:</span>
                              </p>
                              <p className="text-xs leading-relaxed whitespace-pre-line">
                                {aiExplanations[currentQ.id].text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Smooth Bottom Navigation Bar */}
                  <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-t border-gray-800 bg-gray-900/70">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-medium text-gray-300 transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-mono text-gray-400 tabular-nums">
                      Question <strong className="text-white">{currentIndex + 1}</strong> of{' '}
                      {filteredQuestions.length}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))
                      }
                      disabled={currentIndex === filteredQuestions.length - 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/25 transition-all duration-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: Sticky Question Navigator Sidebar (4-3 Cols) */}
            <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6 bg-gray-900/45 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
              {/* Palette Header + Progress Bar */}
              <div className="space-y-2.5 pb-3.5 border-b border-gray-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Question Navigator
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                    {answeredInFilteredCount}/{filteredQuestions.length}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${filteredCompletionPct}%` }}
                  />
                </div>
              </div>

              {/* Quick Jump Buttons Grid */}
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                <div className="grid grid-cols-5 gap-2">
                  {filteredQuestions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = activeAnswers[q.id] !== undefined;
                    const isCorrect = activeAnswers[q.id] === q.correctIndex;

                    let gridBtnClass =
                      'bg-gray-900/90 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700';
                    if (isCurrent) {
                      gridBtnClass = 'bg-blue-600 text-white border-blue-400 font-bold shadow-md';
                    } else if (mode === 'practice' && isAnswered) {
                      gridBtnClass = isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-950/40 border-red-500/50 text-red-400';
                    } else if (isAnswered) {
                      gridBtnClass = 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-9 rounded-lg border text-xs font-mono tabular-nums transition-all duration-200 cursor-pointer flex items-center justify-center relative ${gridBtnClass}`}
                      >
                        <span>{idx + 1}</span>
                        {bookmarkedIds.has(q.id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-gray-950" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2 text-[11px] text-gray-400">
                <p className="font-semibold text-gray-300 text-[10px] uppercase tracking-wider">
                  Status Legend
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-400 shrink-0" />
                    <span className="truncate">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-500 shrink-0" />
                    <span className="truncate">Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-red-950 border border-red-500 shrink-0" />
                    <span className="truncate">Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">Saved</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};