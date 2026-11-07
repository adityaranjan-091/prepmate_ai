import { DSAProblem } from '../types/code';

export const DSA_PROBLEMS: DSAProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // TODO: Implement your O(N) solution using a Hash Map
  
}
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // TODO: Implement your O(N) solution using a Hash Map
  return [];
}
`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # TODO: Implement your O(N) solution using a dictionary
    pass
`,
    },
    solutionCode: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '[[2,7,11,15], 9]',
        expectedOutput: '[0,1]',
      },
      {
        id: 'tc-2',
        input: '[[3,2,4], 6]',
        expectedOutput: '[1,2]',
      },
      {
        id: 'tc-3',
        input: '[[3,3], 6]',
        expectedOutput: '[0,1]',
      },
    ],
    hints: [
      'Can you think of a data structure that allows O(1) average lookup time?',
      'Instead of checking every pair with nested loops (O(n^2)), check if (target - current_number) was already seen.',
      'A Hash Map (dictionary) can map each value to its index in a single pass!',
    ],
    optimalComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.',
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // TODO: Use a stack to track open brackets
  
}
`,
      typescript: `function isValid(s: string): boolean {
  // TODO: Use a stack to track open brackets
  return false;
}
`,
      python: `def is_valid(s: str) -> bool:
    # TODO: Use a stack to track open brackets
    pass
`,
    },
    solutionCode: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      typescript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '["()"]',
        expectedOutput: 'true',
      },
      {
        id: 'tc-2',
        input: '["()[]{}"]',
        expectedOutput: 'true',
      },
      {
        id: 'tc-3',
        input: '["(]"]',
        expectedOutput: 'false',
      },
      {
        id: 'tc-4',
        input: '["([)]"]',
        expectedOutput: 'false',
      },
    ],
    hints: [
      'What data structure follows a Last-In, First-Out (LIFO) order?',
      'Push open brackets onto a stack. When encountering a closing bracket, verify that it matches the top of the stack.',
    ],
    optimalComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // TODO: Use sliding window technique with left and right pointers
  
}
`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  // TODO: Use sliding window technique
  return 0;
}
`,
      python: `def length_of_longest_substring(s: str) -> int:
    # TODO: Implement sliding window
    pass
`,
    },
    solutionCode: {
      javascript: `function lengthOfLongestSubstring(s) {
  let maxLength = 0;
  let left = 0;
  const map = new Map();
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char) && map.get(char) >= left) {
      left = map.get(char) + 1;
    }
    map.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
  let maxLength = 0;
  let left = 0;
  const map = new Map<string, number>();
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char) && map.get(char)! >= left) {
      left = map.get(char)! + 1;
    }
    map.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}`,
      python: `def length_of_longest_substring(s: str) -> int:
    seen = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '["abcabcbb"]',
        expectedOutput: '3',
      },
      {
        id: 'tc-2',
        input: '["bbbbb"]',
        expectedOutput: '1',
      },
      {
        id: 'tc-3',
        input: '["pwwkew"]',
        expectedOutput: '3',
      },
      {
        id: 'tc-4',
        input: '[""]',
        expectedOutput: '0',
      },
    ],
    hints: [
      'Think of a sliding window with two pointers: [left...right].',
      'Use a hash map to remember the last seen index of each character.',
      'When you see a repeated character, move the left pointer just past its last occurrence.',
    ],
    optimalComplexity: {
      time: 'O(N)',
      space: 'O(min(M, N))',
    },
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    category: 'System Design',
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the \`key\` exists. Otherwise, add the \`key-value\` pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.`,
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
      },
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.',
    ],
    starterCode: {
      javascript: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
    // TODO: Initialize data structures (Map / Doubly Linked List)
  }

  /** 
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // TODO: Return value and mark as recently accessed
    return -1;
  }

  /** 
   * @param {number} key 
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // TODO: Insert/update and evict LRU if at capacity
  }
}
`,
      typescript: `class LRUCache {
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    return -1;
  }

  put(key: number, value: number): void {
  }
}
`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity

    def get(self, key: int) -> int:
        return -1

    def put(self, key: int, value: int) -> None:
        pass
`,
    },
    solutionCode: {
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
      typescript: `class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '{"ops":["LRUCache","put","put","get","put","get","put","get","get","get"],"args":[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]}',
        expectedOutput: '[null,null,null,1,null,-1,null,-1,3,4]',
      },
    ],
    hints: [
      'In JavaScript, Map preserves insertion order. In other languages, a Doubly Linked List paired with a Hash Map yields O(1) operations.',
      'When an element is accessed or modified, refresh its order by removing and re-inserting.',
    ],
    optimalComplexity: {
      time: 'O(1) get & put',
      space: 'O(Capacity)',
    },
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.',
      },
    ],
    constraints: [
      '1 <= intervals.length <= 10^4',
      'intervals[i].length == 2',
      '0 <= start_i <= end_i <= 10^4',
    ],
    starterCode: {
      javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
  // TODO: Sort intervals by start time first, then merge
  
}
`,
      typescript: `function merge(intervals: number[][]): number[][] {
  // TODO: Sort intervals by start time first, then merge
  return [];
}
`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    # TODO: Sort intervals and merge overlaps
    pass
`,
    },
    solutionCode: {
      javascript: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}`,
      typescript: `function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}`,
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    merged = []
    for interval in intervals:
        if not merged or merged[-1][1] < interval[0]:
            merged.append(interval)
        else:
            merged[-1][1] = max(merged[-1][1], interval[1])
    return merged`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '[[[1,3],[2,6],[8,10],[15,18]]]',
        expectedOutput: '[[1,6],[8,10],[15,18]]',
      },
      {
        id: 'tc-2',
        input: '[[[1,4],[4,5]]]',
        expectedOutput: '[[1,5]]',
      },
    ],
    hints: [
      'If intervals are sorted by their starting value, overlapping intervals are guaranteed to be adjacent.',
      'Iterate through the sorted intervals: if the current start is <= the previous end, merge them by updating the previous end.',
    ],
    optimalComplexity: {
      time: 'O(N log N)',
      space: 'O(N)',
    },
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      {
        input: 'coins = [1,2,5], amount = 11',
        output: '3',
        explanation: '11 = 5 + 5 + 1',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
      },
      {
        input: 'coins = [1], amount = 0',
        output: '0',
      },
    ],
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4',
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
  // TODO: Build bottom-up DP table where dp[i] is min coins for amount i
  
}
`,
      typescript: `function coinChange(coins: number[], amount: number): number {
  // TODO: Build bottom-up DP table
  return -1;
}
`,
      python: `def coin_change(coins: list[int], amount: int) -> int:
    # TODO: Build bottom-up DP table
    pass
`,
    },
    solutionCode: {
      javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      typescript: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      python: `def coin_change(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if i - coin >= 0:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: '[[1,2,5], 11]',
        expectedOutput: '3',
      },
      {
        id: 'tc-2',
        input: '[[2], 3]',
        expectedOutput: '-1',
      },
      {
        id: 'tc-3',
        input: '[[1], 0]',
        expectedOutput: '0',
      },
    ],
    hints: [
      'Define dp[i] as the minimum number of coins needed to make amount i.',
      'Initialize dp[0] = 0 and all other dp[i] to Infinity.',
      'For each amount from 1 to total, check each coin: dp[i] = min(dp[i], dp[i - coin] + 1).',
    ],
    optimalComplexity: {
      time: 'O(Amount * Coins)',
      space: 'O(Amount)',
    },
  },
];
