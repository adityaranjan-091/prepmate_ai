import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Play,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { DSAProblem, ExecutionResult } from '../../types/code';
import { DSA_PROBLEMS } from '../../data/dsaProblems';
import { codeRunnerService } from '../../services/codeRunner';
import { useInterviewStore } from '../../store/interviewStore';

type SupportedLanguage = 'javascript' | 'typescript' | 'python';
type WorkspaceTab = 'problem' | 'testcases' | 'console';

export interface CodingWorkspaceProps {
  problemId?: string;
  onAskForHint?: (hintIndex: number) => void;
}

const ENTRYPOINT_MAP: Record<string, string> = {
  'two-sum': 'twoSum',
  'valid-parentheses': 'isValid',
  'lru-cache': 'LRUCache',
  'merge-intervals': 'merge',
};

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  problemId = 'two-sum',
  onAskForHint,
}) => {
  const {
    codeSnippet,
    setCodeSnippet,
    selectedLanguage,
    setSelectedLanguage,
  } = useInterviewStore();

  const [problem, setProblem] = useState<DSAProblem>(
    () => DSA_PROBLEMS.find((p) => p.id === problemId) || DSA_PROBLEMS[0]
  );
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('problem');

  const prevProblemIdRef = useRef<string | null>(null);
  const runCodeRef = useRef<() => void>(() => { });

  // Sync problem and starter code when problemId changes
  useEffect(() => {
    const found = DSA_PROBLEMS.find((p) => p.id === problemId) || DSA_PROBLEMS[0];
    setProblem(found);

    const isProblemChanged = prevProblemIdRef.current !== found.id;
    if (isProblemChanged) {
      prevProblemIdRef.current = found.id;
      setRevealedHints(0);
      setExecutionResult(null);
      setActiveTab('problem');

      const starter =
        found.starterCode[selectedLanguage as SupportedLanguage] ||
        found.starterCode.javascript;
      setCodeSnippet(starter);
    } else if (!codeSnippet.trim()) {
      const starter =
        found.starterCode[selectedLanguage as SupportedLanguage] ||
        found.starterCode.javascript;
      setCodeSnippet(starter);
    }
  }, [problemId, selectedLanguage, codeSnippet, setCodeSnippet]);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    const starter = problem.starterCode[lang] || problem.starterCode.javascript;
    setCodeSnippet(starter);
  };

  const handleResetCode = () => {
    const starter =
      problem.starterCode[selectedLanguage as SupportedLanguage] ||
      problem.starterCode.javascript;
    setCodeSnippet(starter);
    setExecutionResult(null);
  };

  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveTab('testcases');

    const fnName = ENTRYPOINT_MAP[problem.id] || 'twoSum';

    try {
      const result = await codeRunnerService.runCode(
        codeSnippet,
        selectedLanguage,
        problem.testCases,
        fnName
      );
      setExecutionResult(result);
    } catch (err) {
      setExecutionResult({
        passed: false,
        passedTests: 0,
        totalTests: problem.testCases.length,
        runtimeMs: 0,
        error: err instanceof Error ? err.message : 'Execution failed unexpectedly.',
        logs: [],
        testResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, problem, codeSnippet, selectedLanguage]);

  useEffect(() => {
    runCodeRef.current = handleRunCode;
  }, [handleRunCode]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Bind Ctrl+Enter / Cmd+Enter to execute tests directly from Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCodeRef.current();
    });
  };

  const handleRevealNextHint = () => {
    if (revealedHints < problem.hints.length) {
      const nextIndex = revealedHints + 1;
      setRevealedHints(nextIndex);
      setActiveTab('problem');
      onAskForHint?.(nextIndex);
    }
  };

  const difficultyBadgeClass =
    problem.difficulty === 'Easy'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : problem.difficulty === 'Medium'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
      {/* Top Workspace Toolbar */}
      <div className="h-12 border-b border-gray-800 bg-gray-900/90 px-4 flex items-center justify-between gap-2 select-none shrink-0">
        <div className="flex items-center gap-3">
          {/* Tab switcher: Problem vs Tests vs Console */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700/60">
            {(
              [
                { id: 'problem', label: 'Description' },
                { id: 'testcases', label: 'Test Cases' },
                { id: 'console', label: 'Console Output' },
              ] as { id: WorkspaceTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${difficultyBadgeClass}`}
          >
            {problem.difficulty}
          </span>
        </div>

        {/* Right side controls: Hint, Language, Reset, Run */}
        <div className="flex items-center gap-2">
          {/* Socratic Hint */}
          <button
            type="button"
            onClick={handleRevealNextHint}
            disabled={revealedHints >= problem.hints.length}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            title="Ask AI for a Socratic hint"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>
              Hint ({revealedHints}/{problem.hints.length})
            </span>
          </button>

          {/* Language selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            aria-label="Select programming language"
            className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>

          {/* Reset Code Button */}
          <button
            type="button"
            onClick={handleResetCode}
            title="Reset to starter code"
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code Button */}
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            title="Run test suite (Ctrl/Cmd + Enter)"
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Left Details & Right Monaco Editor */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 overflow-hidden min-h-0">
        {/* Left Side: Problem Statement / Tests / Console */}
        <div className="h-full overflow-y-auto p-5 space-y-4 bg-gray-900/40 text-xs text-gray-300">
          {activeTab === 'problem' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white mb-1">{problem.title}</h2>
                <div className="text-gray-300 whitespace-pre-line leading-relaxed select-text">
                  {problem.description}
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1 font-mono select-text"
                  >
                    <p className="text-gray-400">
                      <strong className="text-gray-300">Input:</strong> {ex.input}
                    </p>
                    <p className="text-emerald-400">
                      <strong className="text-gray-300">Output:</strong> {ex.output}
                    </p>
                    {ex.explanation && (
                      <p className="text-gray-400 font-sans text-[11px] pt-1">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-white">Constraints</h3>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 font-mono text-[11px] select-text">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Revealed Hints */}
              {revealedHints > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Hints from Interviewer</span>
                  </h3>
                  {problem.hints.slice(0, revealedHints).map((hint, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs"
                    >
                      <strong className="text-amber-400">Hint {idx + 1}:</strong> {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Test Suite Results</h2>
                {executionResult && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-gray-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{executionResult.runtimeMs}ms</span>
                    </span>
                    <span
                      className={`font-semibold ${executionResult.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}
                    >
                      {executionResult.passedTests} / {executionResult.totalTests} Passed
                    </span>
                  </div>
                )}
              </div>

              {executionResult?.error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-xs whitespace-pre-wrap select-text">
                  {executionResult.error}
                </div>
              )}

              {/* Test Case Cards */}
              <div className="space-y-2.5">
                {(
                  executionResult?.testResults?.length
                    ? executionResult.testResults
                    : problem.testCases.map((tc) => ({
                      testCaseId: tc.id,
                      passed: false,
                      input: tc.input,
                      expected: tc.expectedOutput,
                      actual: 'Not yet executed',
                    }))
                ).map((tc, idx) => {
                  const isPending = tc.actual === 'Not yet executed';
                  return (
                    <div
                      key={tc.testCaseId || idx}
                      className={`p-3 rounded-xl border font-mono space-y-1.5 select-text ${isPending
                          ? 'bg-gray-900 border-gray-800'
                          : tc.passed
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-red-950/20 border-red-500/30'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-300">Case {idx + 1}</span>
                        {isPending ? (
                          <span className="text-gray-500 text-[10px]">Pending</span>
                        ) : tc.passed ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-[11px] font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400">
                        Input: <span className="text-white">{tc.input}</span>
                      </p>
                      <p className="text-gray-400">
                        Expected: <span className="text-emerald-400">{tc.expected}</span>
                      </p>
                      {!isPending && (
                        <p className="text-gray-400">
                          Actual:{' '}
                          <span className={tc.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {tc.actual}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 text-gray-400">
                <Terminal className="w-4 h-4 text-gray-500" />
                <span className="font-semibold">Standard Output</span>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-gray-800 min-h-[180px] text-gray-300 whitespace-pre-wrap leading-relaxed select-text">
                {executionResult?.logs && executionResult.logs.length > 0
                  ? executionResult.logs.join('\n')
                  : 'No logs printed. Use console.log() or print() to inspect variables.'}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Monaco Code Editor */}
        <div className="h-full flex flex-col bg-[#1e1e1e] min-h-0">
          <Editor
            height="100%"
            language={
              selectedLanguage === 'python'
                ? 'python'
                : selectedLanguage === 'typescript'
                  ? 'typescript'
                  : 'javascript'
            }
            theme="vs-dark"
            value={codeSnippet}
            onMount={handleEditorMount}
            onChange={(val) => setCodeSnippet(val ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      </div>
    </div>
  );
};