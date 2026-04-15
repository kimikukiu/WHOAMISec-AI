import { NextResponse } from 'next/server';

export interface LoopProblem {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  template: string;
  hint?: string;
}

const LOOP_PROBLEMS: LoopProblem[] = [
  {
    id: 1,
    title: 'FizzBuzz',
    description: 'Print numbers from 1 to 100. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".',
    difficulty: 'beginner',
    category: 'classic',
    template: 'for (let i = 1; i <= 100; i++) {\n  // Your code here\n}',
    hint: 'Use modulo operator (%) to check divisibility',
  },
  {
    id: 2,
    title: 'Sum of First N Natural Numbers',
    description: 'Calculate the sum of all natural numbers from 1 to N.',
    difficulty: 'beginner',
    category: 'math',
    template: 'function sumToN(n) {\n  let sum = 0;\n  // Your code here\n  return sum;\n}',
    hint: 'Use a loop to add each number to the sum variable',
  },
  {
    id: 3,
    title: 'Reverse a String',
    description: 'Reverse the given string without using built-in reverse methods.',
    difficulty: 'beginner',
    category: 'strings',
    template: 'function reverseString(str) {\n  let reversed = "";\n  // Your code here\n  return reversed;\n}',
    hint: 'Iterate from the end of the string and build a new string',
  },
  {
    id: 4,
    title: 'Palindrome Checker',
    description: 'Check if a given string is a palindrome (reads the same forwards and backwards).',
    difficulty: 'beginner',
    category: 'strings',
    template: 'function isPalindrome(str) {\n  // Your code here\n  // Return true or false\n}',
    hint: 'Compare characters from both ends moving towards the center',
  },
  {
    id: 5,
    title: 'Fibonacci Sequence',
    description: 'Generate the first N numbers of the Fibonacci sequence.',
    difficulty: 'intermediate',
    category: 'math',
    template: 'function fibonacci(n) {\n  const sequence = [0, 1];\n  // Your code here\n  return sequence;\n}',
    hint: 'Each number is the sum of the two preceding ones',
  },
  {
    id: 6,
    title: 'Two Sum',
    description: 'Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices.',
    difficulty: 'intermediate',
    category: 'arrays',
    template: 'function twoSum(nums, target) {\n  // Your code here\n  // Return an array of two indices\n}',
    hint: 'Use a hash map to store numbers you have already seen',
  },
  {
    id: 7,
    title: 'Matrix Spiral Traversal',
    description: 'Traverse a 2D matrix in spiral order (clockwise, starting from top-left).',
    difficulty: 'advanced',
    category: 'matrices',
    template: 'function spiralOrder(matrix) {\n  const result = [];\n  // Your code here\n  return result;\n}',
    hint: 'Track boundaries (top, bottom, left, right) and shrink them after each traversal',
  },
  {
    id: 8,
    title: 'Find All Duplicates in Array',
    description: 'Given an array where 1 ≤ nums[i] ≤ n, find all elements that appear twice. Do it in O(n) time and O(1) space.',
    difficulty: 'intermediate',
    category: 'arrays',
    template: 'function findDuplicates(nums) {\n  const duplicates = [];\n  // Your code here\n  return duplicates;\n}',
    hint: 'Use the sign of each element as a marker by making values negative when visited',
  },
  {
    id: 9,
    title: 'Count Prime Numbers',
    description: 'Count all prime numbers less than a given number N using the Sieve of Eratosthenes.',
    difficulty: 'intermediate',
    category: 'math',
    template: 'function countPrimes(n) {\n  // Your code here\n  // Use Sieve of Eratosthenes\n}',
    hint: 'Create a boolean array and mark multiples of each prime as composite',
  },
  {
    id: 10,
    title: 'Longest Increasing Subsequence',
    description: 'Find the length of the longest strictly increasing subsequence in an array.',
    difficulty: 'advanced',
    category: 'dynamic-programming',
    template: 'function lengthOfLIS(nums) {\n  // Your code here\n  // Return the length\n}',
    hint: 'Use dynamic programming: for each element, find the longest increasing subsequence ending at that element',
  },
  {
    id: 11,
    title: 'Rotate Image (Matrix)',
    description: 'Rotate an N×N matrix by 90 degrees clockwise in-place.',
    difficulty: 'advanced',
    category: 'matrices',
    template: 'function rotate(matrix) {\n  const n = matrix.length;\n  // Your code here - modify matrix in-place\n}',
    hint: 'First transpose the matrix, then reverse each row',
  },
  {
    id: 12,
    title: 'Container With Most Water',
    description: 'Given an array of heights, find two lines that together with the x-axis form a container that holds the most water.',
    difficulty: 'intermediate',
    category: 'two-pointers',
    template: 'function maxArea(height) {\n  let maxWater = 0;\n  // Your code here\n  return maxWater;\n}',
    hint: 'Use two pointers starting at both ends, move the shorter one inward',
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: LOOP_PROBLEMS.length,
      problems: LOOP_PROBLEMS,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load problems' },
      { status: 500 }
    );
  }
}
