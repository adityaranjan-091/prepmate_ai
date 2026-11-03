export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface DSAProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Arrays & Hashing' | 'Two Pointers' | 'Sliding Window' | 'Trees & Graphs' | 'Dynamic Programming' | 'System Design';
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  starterCode: {
    javascript: string;
    python: string;
    typescript: string;
  };
  testCases: TestCase[];
  hints: string[];
  optimalComplexity: {
    time: string;
    space: string;
  };
}

export interface ExecutionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  logs: string[];
  error?: string;
  runtimeMs: number;
  testResults: {
    testCaseId: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    error?: string;
  }[];
}

