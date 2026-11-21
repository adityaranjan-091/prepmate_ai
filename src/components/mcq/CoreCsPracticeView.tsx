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
  HelpCircle,
  Sparkles,
  Clock,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Award,
  Layers,
  ChevronDown,
  ChevronRight,
  Flame,
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

  // Local answers state for timed assessment mode (so assessment doesn't overwrite practice until submitted or acts as temp)
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
      // Practice mode: persist to Firestore via useMCQStore
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a0d] p-4 sm:p-6 gap-4 select-none">
      {/* ───────────── Header Bar & Stats ───────────── */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-xl backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">Core CS &amp; OA Question Bank</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {CORE_CS_QUESTIONS.length} Questions
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Master OS, DBMS, Networks, OOP, and Algorithm theory tested in top company Online Assessments.
          </p>
        </div>

        {/* Global Progress Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Accuracy</p>
              <p className="font-bold text-emerald-400 font-mono">{stats.percentage}%</p>
            </div>
            <div className="h-6 w-px bg-gray-800" />
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Solved</p>
              <p className="font-bold text-white font-mono">
                {stats.correct} / {stats.attempted}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => {
                setMode('practice');
                setIsAssessmentActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'practice'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'assessment'
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
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ───────────── Filter Bar ───────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] text-gray-500 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Search & Difficulty & Bookmark */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or company..."
              className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              onlyBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({bookmarkedIds.size})</span>
          </button>
        </div>
      </div>

      {/* ───────────── Main Content Area ───────────── */}
      {mode === 'assessment' && !assessmentSubmitted && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Clock className="w-4 h-4 animate-pulse text-purple-400" />
            <span className="font-semibold">Timed Online Assessment (OA) Simulation</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold text-purple-200">
              Time Left: {formatTimer(assessmentSecondsLeft)}
            </span>
            <button
              type="button"
              onClick={() => setAssessmentSubmitted(true)}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      )}

      {/* Assessment Completed Scorecard */}
      {mode === 'assessment' && assessmentSubmitted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950 rounded-2xl border border-gray-800 space-y-6 text-center max-w-xl mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 grid place-items-center text-white shadow-xl shadow-purple-600/30 ring-1 ring-white/20">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Assessment Evaluation Complete</h2>
            <p className="text-xs text-gray-400 mt-1">Here is how you scored on the Core CS Online Assessment round.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full font-mono">
            <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Score</p>
              <p className="text-xl font-bold text-emerald-400">
                {stats.correct} / {filteredQuestions.length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Accuracy</p>
              <p className="text-xl font-bold text-blue-400">{stats.percentage}%</p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Outcome</p>
              <p className="text-xs font-semibold text-purple-300 mt-1">
                {stats.percentage >= 75 ? 'Qualified (Pass)' : 'Needs Revision'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('practice');
                setAssessmentSubmitted(false);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
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
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950 rounded-2xl border border-gray-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-300">No questions match your current filters</h3>
          <p className="text-xs text-gray-500">Try clearing the search query or selecting "All Subjects".</p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject('All');
              setSelectedDifficulty('All');
              setSearchQuery('');
              setOnlyBookmarked(false);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Question Card & Sidebar Layout */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
          {/* Main Question View (Left 8-9 cols) */}
          <div className="lg:col-span-9 flex flex-col h-full bg-gray-950 border border-gray-800 rounded-2xl p-5 overflow-y-auto space-y-5 shadow-2xl">
            {currentQ && (
              <>
                {/* Question Header & Meta Badges */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-800/80 pb-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                        {currentQ.subject}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded-full">
                        {currentQ.topic}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          currentQ.difficulty === 'Easy'
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
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span>Asked at:</span>
                        {currentQ.companyTags.map((company) => (
                          <span
                            key={company}
                            className="px-1.5 py-0.2 rounded bg-gray-900 border border-gray-800 text-gray-400 font-medium"
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
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      bookmarkedIds.has(currentQ.id)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
                    }`}
                    title={bookmarkedIds.has(currentQ.id) ? 'Remove bookmark' : 'Bookmark question'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* Question Prompt */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold text-gray-500 mt-0.5">
                      Q{currentIndex + 1}.
                    </span>
                    <h2 className="text-sm sm:text-base font-semibold text-white leading-relaxed select-text">
                      {currentQ.question}
                    </h2>
                  </div>

                  {/* Optional Code Snippet */}
                  {currentQ.codeSnippet && (
                    <div className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 font-mono text-xs text-gray-200 overflow-x-auto select-text whitespace-pre leading-relaxed">
                      {currentQ.codeSnippet}
                    </div>
                  )}
                </div>

                {/* 4 Interactive Options */}
                <div className="space-y-2.5 pt-1">
                  {currentQ.options.map((option, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    const isSelected = activeAnswers[currentQ.id] === idx;
                    const isAnswered = activeAnswers[currentQ.id] !== undefined;
                    const isCorrect = idx === currentQ.correctIndex;

                    // Option styling depending on practice mode & correctness
                    let optionClass =
                      'bg-gray-900/60 border-gray-800 text-gray-200 hover:border-gray-700 hover:bg-gray-900';
                    let letterClass = 'bg-gray-800 text-gray-400 border-gray-700';

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
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left text-xs transition cursor-pointer ${optionClass}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border font-mono font-bold text-[11px] grid place-items-center shrink-0 ${letterClass}`}
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
                  <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        {activeAnswers[currentQ.id] === currentQ.correctIndex ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span>Incorrect — Option {String.fromCharCode(65 + currentQ.correctIndex)} is the right answer</span>
                          </div>
                        )}
                      </div>

                      {/* Ask AI Explanation Button */}
                      <button
                        type="button"
                        onClick={() => handleAskAIExplanation(currentQ)}
                        disabled={aiExplanations[currentQ.id]?.loading}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition cursor-pointer"
                      >
                        {aiExplanations[currentQ.id]?.loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Ask AI to Break Down</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-gray-300 leading-relaxed select-text">
                      <p>{currentQ.explanation}</p>
                      {currentQ.keyTakeaway && (
                        <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-blue-300 text-[11px] font-medium">
                          <strong>Key Interview Rule:</strong> {currentQ.keyTakeaway}
                        </div>
                      )}

                      {/* AI Generated In-depth Breakdown if requested */}
                      {aiExplanations[currentQ.id]?.text && (
                        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs space-y-1 animate-fadeIn">
                          <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Socratic Concept Insight:</span>
                          </p>
                          <p className="text-[11px] leading-relaxed whitespace-pre-line">
                            {aiExplanations[currentQ.id].text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Navigation Toolbar */}
                <div className="flex items-center justify-between border-t border-gray-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono text-gray-500">
                    Question {currentIndex + 1} of {filteredQuestions.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))
                    }
                    disabled={currentIndex === filteredQuestions.length - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Question Palette & Quick Jump Sidebar (Right 3-4 cols) */}
          <div className="lg:col-span-3 flex flex-col h-full bg-gray-950 border border-gray-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                Question Grid
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">
                {Object.keys(activeAnswers).length}/{filteredQuestions.length} Answered
              </span>
            </div>

            {/* Quick Jump Buttons Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {filteredQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = activeAnswers[q.id] !== undefined;
                const isCorrect = activeAnswers[q.id] === q.correctIndex;

                let gridBtnClass = 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white';
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
                    className={`h-8 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center justify-center relative ${gridBtnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {bookmarkedIds.has(q.id) && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5 text-[10px] text-gray-400">
              <p className="font-semibold text-gray-300">Status Legend:</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400 shrink-0" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500 shrink-0" />
                <span>Correct Answer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-950 border border-red-500 shrink-0" />
                <span>Incorrect Answer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>Bookmarked</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
