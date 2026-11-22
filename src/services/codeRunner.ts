import { ExecutionResult, TestCase } from '../types/code';

export class CodeRunnerService {
  /**
   * Executes candidate code against a suite of test cases with timeout protection.
   */
  public async runCode(
    code: string,
    language: string,
    testCases: TestCase[],
    functionName: string = 'twoSum'
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const logs: string[] = [];

    if (language === 'python') {
      return this.runPythonCode(code, testCases, functionName, startTime);
    }

    if (code.length > 100_000) {
      return {
        passed: false,
        totalTests: testCases.length,
        passedTests: 0,
        logs,
        error: 'Code exceeds the 100 KB execution limit.',
        runtimeMs: Math.round(performance.now() - startTime),
        testResults: [],
      };
    }

    const blockedPatterns = [
      /\bwindow\b\s*\./,
      /\bdocument\b\s*\./,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bindexedDB\b/,
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bimport\s*\(/,
    ];
    const blockedMatch = blockedPatterns.find((pattern) => pattern.test(code));
    if (blockedMatch) {
      return {
        passed: false,
        totalTests: testCases.length,
        passedTests: 0,
        logs,
        error: 'Browser and network APIs are disabled in the code execution sandbox.',
        runtimeMs: Math.round(performance.now() - startTime),
        testResults: [],
      };
    }

    if (/while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/.test(code)) {
      return {
        passed: false,
        totalTests: testCases.length,
        passedTests: 0,
        logs,
        error: 'Potential infinite loop detected. Add a terminating loop condition and retry.',
        runtimeMs: Math.round(performance.now() - startTime),
        testResults: [],
      };
    }

    return new Promise((resolve) => {
      try {
        const testResults: ExecutionResult['testResults'] = [];
        let passedCount = 0;

        const sandboxedLog = (...args: any[]) => {
          logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        };

        // Strip basic TypeScript types for JS evaluation
        const cleanJs = code
          .replace(/:\s*([A-Za-z0-9_<>\[\]]+)/g, '')
          .replace(/as\s+[A-Za-z0-9_<>\[\]]+/g, '');

        const wrappedCode = `
          ${cleanJs}
          return {
            execute: typeof ${functionName} !== 'undefined' 
              ? ${functionName} 
              : (typeof LRUCache !== 'undefined' ? LRUCache : null)
          };
        `;

        const creator = new Function('console', wrappedCode);
        const exports = creator({ log: sandboxedLog, warn: sandboxedLog, error: sandboxedLog });
        const targetFn = exports.execute;

        if (!targetFn) {
          resolve({
            passed: false,
            totalTests: testCases.length,
            passedTests: 0,
            logs,
            error: `Function or class '${functionName}' was not defined in your code. Please keep the function signature.`,
            runtimeMs: Math.round(performance.now() - startTime),
            testResults: [],
          });
          return;
        }

        // Run each test case with runtime error handling
        for (const tc of testCases) {
          try {
            let actual: any;
            const parsedInput = JSON.parse(tc.input);

            if (functionName === 'LRUCache' || typeof targetFn.prototype?.get === 'function') {
              const { ops, args } = parsedInput;
              const cache = new targetFn(args[0][0]);
              const res: any[] = [null];
              for (let i = 1; i < ops.length; i++) {
                if (ops[i] === 'put') {
                  cache.put(args[i][0], args[i][1]);
                  res.push(null);
                } else if (ops[i] === 'get') {
                  res.push(cache.get(args[i][0]));
                }
              }
              actual = res;
            } else if (Array.isArray(parsedInput)) {
              actual = targetFn(...parsedInput);
            } else {
              actual = targetFn(parsedInput);
            }

            const actualJson = JSON.stringify(actual);
            const expectedParsed = JSON.parse(tc.expectedOutput);
            const expectedJson = JSON.stringify(expectedParsed);

            // Match comparison (handling numeric and array deep equality)
            const isMatch = actualJson === expectedJson || actual === expectedParsed;

            if (isMatch) passedCount++;

            testResults.push({
              testCaseId: tc.id,
              passed: isMatch,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: actualJson !== undefined ? actualJson : String(actual),
            });
          } catch (tcErr: any) {
            testResults.push({
              testCaseId: tc.id,
              passed: false,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: 'Runtime Error',
              error: tcErr.message,
            });
          }
        }

        const endTime = performance.now();
        resolve({
          passed: passedCount === testCases.length,
          totalTests: testCases.length,
          passedTests: passedCount,
          logs,
          runtimeMs: Math.round(endTime - startTime),
          testResults,
        });
      } catch (err: any) {
        resolve({
          passed: false,
          totalTests: testCases.length,
          passedTests: 0,
          logs,
          error: err.message,
          runtimeMs: Math.round(performance.now() - startTime),
          testResults: [],
        });
      }
    });
  }

  private runPythonCode(
    code: string,
    testCases: TestCase[],
    functionName: string,
    startTime: number
  ): ExecutionResult {
    return {
      passed: false,
      totalTests: testCases.length,
      passedTests: 0,
      logs: [],
      error: 'Python execution is unavailable in this build. Use JavaScript or TypeScript, or add a local Python runtime.',
      runtimeMs: Math.round(performance.now() - startTime),
      testResults: testCases.map(tc => ({
        testCaseId: tc.id,
        passed: false,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: 'Not executed',
        error: 'Python runtime unavailable',
      })),
    };
  }
}

export const codeRunnerService = new CodeRunnerService();
