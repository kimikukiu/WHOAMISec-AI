// Universal Loop Coder - Curriculum Data Structure
// Educational loop coding curriculum for Hermes Bot

export const LOOP_LANGUAGES = [
  { name: 'Python', ext: '.py', loops: ['for', 'while', 'list comprehensions'] },
  { name: 'JavaScript', ext: '.js', loops: ['for', 'while', 'forEach', 'map'] },
  { name: 'TypeScript', ext: '.ts', loops: ['for', 'while', 'forEach', 'map'] },
  { name: 'Go', ext: '.go', loops: ['for'] },
  { name: 'Rust', ext: '.rs', loops: ['for', 'while', 'loop'] },
  { name: 'C++', ext: '.cpp', loops: ['for', 'while', 'do-while'] },
  { name: 'Java', ext: '.java', loops: ['for', 'while', 'for-each'] },
  { name: 'C#', ext: '.cs', loops: ['for', 'while', 'foreach'] },
  { name: 'Ruby', ext: '.rb', loops: ['each', 'times', 'while'] },
  { name: 'Swift', ext: '.swift', loops: ['for-in', 'while', 'repeat-while'] },
  { name: 'Kotlin', ext: '.kt', loops: ['for', 'while', 'forEach'] },
  { name: 'Lua', ext: '.lua', loops: ['for', 'while', 'repeat-until'] },
];

export const HERMES_TIERS = [
  { name: 'Intermediate', model: 'Mistral-7B / Llama-2-7B', focus: 'Core loop concepts with error handling' },
  { name: 'Explanation', model: 'Zephyr-7B', focus: 'Code + detailed explanations, teaching-oriented' },
  { name: 'Adaptability', model: 'OpenHermes-2.5-Mistral-7B', focus: 'Precise instructions, specific constraints' },
  { name: 'Advanced', model: 'Solar-10.7B / Yi-6B/9B', focus: 'Algorithms, optimization, data structures' },
  { name: 'Expert', model: 'Yi-34B', focus: 'Complex algorithms, compilers, advanced reasoning' },
];

export const TRAINING_PROMPTS = [
  { tier: 0, title: 'Factorial Calculator', prompt: 'Write a program using a for loop to calculate the factorial of a number. Include error handling for negative input.' },
  { tier: 0, title: 'Even Number Filter', prompt: 'Create a function that takes a list of numbers and returns only the even numbers using a while loop.' },
  { tier: 0, title: 'Multiplication Table', prompt: 'Write a program that prints a multiplication table for numbers 2-5 using nested for loops.' },
  { tier: 0, title: 'Dice Roll Game', prompt: 'Simulate a dice roll game. Ask how many rolls, then use a for loop to roll that many times.' },
  { tier: 1, title: 'Prime Sum', prompt: 'Find the sum of all prime numbers up to 100. Use both for and while loops. Explain each step.' },
  { tier: 1, title: 'Loop Comparison', prompt: 'Explain the difference between for and while loops. Provide examples showing when each is most appropriate.' },
  { tier: 1, title: 'String Reversal', prompt: 'Write a function that reverses a string using a for loop. Explain the logic.' },
  { tier: 1, title: 'Fibonacci', prompt: 'Generate the Fibonacci sequence up to 10 terms using a while loop. Explain why while over for.' },
  { tier: 2, title: 'Manual Average', prompt: "Write calculate_average(list) using a for loop. Do NOT use sum()." },
  { tier: 2, title: 'Diamond Pattern', prompt: 'Print a diamond shape of height 7 using nested for loops. Center the output.' },
  { tier: 2, title: 'File Reader', prompt: 'Read a file line by line using a while loop, convert to integers, calculate sum. Handle ValueError.' },
  { tier: 2, title: 'Guessing Game', prompt: 'Random number 1-100, user has 10 guesses. Use while loop with feedback after each guess.' },
  { tier: 3, title: 'Quicksort', prompt: 'Implement quicksort to sort a list ascending. Include comments explaining each step.' },
  { tier: 3, title: 'Anagram Finder', prompt: 'Find all anagrams of a given word in a list. Optimize for performance.' },
  { tier: 3, title: 'String Grouping', prompt: 'Group a list of strings by first letter using a dictionary. Handle empty input.' },
  { tier: 3, title: 'BFS Pathfinding', prompt: 'Implement BFS to find shortest path in a graph (adjacency list). Include comments.' },
  { tier: 4, title: 'N-Queens', prompt: 'Solve N-Queens using backtracking and loops. Find all solutions.' },
  { tier: 4, title: 'A* Search', prompt: 'Implement A* search for shortest path on a grid with obstacles. Use priority queue.' },
  { tier: 4, title: 'Expression Evaluator', prompt: 'Evaluate a math expression string using a stack and loops. Handle operator precedence.' },
  { tier: 4, title: 'Simple Compiler', prompt: 'Implement a simple compiler for a basic language (assignment, addition, print). Generate assembly.' },
];

/** Get training tier index from model name */
export function getTierForModel(model: string): number {
  const m = (model || '').toLowerCase();
  if (m.includes('34b') || m.includes('yi-34')) return 4;
  if (m.includes('solar') || m.includes('10.7b')) return 3;
  if (m.includes('hermes-2.5') || m.includes('openhermes')) return 2;
  if (m.includes('zephyr')) return 1;
  return 0; // default intermediate
}

/** Get prompts for a specific tier */
export function getPromptsForTier(tier: number) {
  return TRAINING_PROMPTS.filter(p => p.tier === tier);
}

/** Get a random training prompt for a tier */
export function getRandomPrompt(tier: number) {
  const prompts = getPromptsForTier(tier);
  return prompts[Math.floor(Math.random() * prompts.length)] || null;
}

/** Find language by name (case-insensitive, partial match) */
export function findLanguage(name: string) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return LOOP_LANGUAGES.find(l =>
    l.name.toLowerCase() === lower ||
    l.name.toLowerCase().startsWith(lower) ||
    l.ext.replace('.', '').toLowerCase() === lower
  ) || null;
}
