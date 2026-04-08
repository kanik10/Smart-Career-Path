import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import {
  GamificationProfile,
  StageProgress,
  XPLog,
  SpinReward,
  QuestionCache,
  PerformanceLog,
} from '../models/gamificationModel.js';
import {
  generateSprintQuestions,
  generateFlashcards,
  generateBossBattleQuestions,
  generateSpinQuestions,
  generateDomainTopics,
} from '../utils/groqQuestionGenerator.js';

// XP configuration per game type
const XP_REWARDS = {
  sprint: 100,
  spin: 100,
  flashcards: 200,
  boss_battle: 300,
};

// XP required per level
const XP_PER_LEVEL = 1000;
const OPTION_PLACEHOLDER_REGEX = /^option\s*[a-z0-9]*$/i;
const SPIN_QUESTION_TEMPLATE_REGEX = /quick question about|question\s+\d+\s*:|choose the best answer/i;
const SPIN_OPTION_TEMPLATE_REGEX = /most accurate .* principle|common mistake in|partially correct .* statement|irrelevant distractor/i;
const FLASHCARD_TERM_TEMPLATE_REGEX = /(concept|card|term)\s*\d+$/i;
const FLASHCARD_DEFINITION_TEMPLATE_REGEX = /^core explanation\s*\d+\s*for\s+/i;
const BOSS_PHASE_TARGETS = {
  Easy: 8,
  Medium: 10,
  Hard: 12,
};

const SPIN_TOPIC_FALLBACKS = {
  'Arrays & Strings': [
    { question: 'What is the time complexity to access arr[i] in an array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 0 },
    { question: 'Which approach is commonly used to reverse a string in-place?', options: ['Two pointers', 'Binary search', 'Greedy', 'BFS'], correctAnswer: 0 },
    { question: 'What does a sliding window primarily help optimize?', options: ['Repeated subarray checks', 'Tree balancing', 'Heap insertion', 'Graph coloring'], correctAnswer: 0 },
    { question: 'For finding longest substring without repetition, which structure is usually used?', options: ['Hash set/map', 'Min-heap', 'Disjoint set', 'Segment tree'], correctAnswer: 0 },
    { question: 'Which method is best for checking if two strings are anagrams quickly?', options: ['Frequency counting', 'Depth-first search', 'Topological sort', 'Binary lifting'], correctAnswer: 0 },
  ],
  'Linked List': [
    { question: 'Which operation is O(1) in a singly linked list when head is known?', options: ['Insert at head', 'Access by index', 'Search by value', 'Find middle without pointers'], correctAnswer: 0 },
    { question: 'Which technique is used to detect a linked-list cycle?', options: ['Slow and fast pointers', 'Prefix sums', 'Monotonic queue', 'Union-find'], correctAnswer: 0 },
    { question: 'In a doubly linked list, each node stores:', options: ['Previous and next pointers', 'Only next pointer', 'Only previous pointer', 'Heap index'], correctAnswer: 0 },
    { question: 'To reverse a linked list iteratively, what is updated in each step?', options: ['Current node next pointer', 'Node values only', 'Array indices', 'Tree depth'], correctAnswer: 0 },
    { question: 'Which linked-list operation often needs a dummy node to simplify edge cases?', options: ['Delete in middle/head operations', 'Cycle detection', 'Tail traversal only', 'Sorting by heap'], correctAnswer: 0 },
  ],
  Stack: [
    { question: 'Stack follows which order?', options: ['LIFO', 'FIFO', 'Random', 'Priority'], correctAnswer: 0 },
    { question: 'Which operation removes and returns the top stack element?', options: ['Pop', 'Peek', 'Push', 'Enqueue'], correctAnswer: 0 },
    { question: 'Which is a classic stack use case?', options: ['Balanced parentheses', 'Level-order traversal', 'Shortest path in weighted graph', 'Hash collision resolution'], correctAnswer: 0 },
    { question: 'When evaluating postfix expressions, which structure is used?', options: ['Stack', 'Queue', 'Trie', 'Graph'], correctAnswer: 0 },
    { question: 'Time complexity of push and pop in an ideal stack is usually:', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 0 },
  ],
  Queue: [
    { question: 'Queue follows which order?', options: ['FIFO', 'LIFO', 'Random', 'Sorted'], correctAnswer: 0 },
    { question: 'Which operation inserts an element into a queue?', options: ['Enqueue', 'Pop', 'Peek', 'PushFront'], correctAnswer: 0 },
    { question: 'Breadth-first search relies on which structure?', options: ['Queue', 'Stack', 'Heap', 'Trie'], correctAnswer: 0 },
    { question: 'Which queue variant supports insert/delete at both ends?', options: ['Deque', 'Priority queue', 'Circular list only', 'Stack queue'], correctAnswer: 0 },
    { question: 'What is front in a queue?', options: ['Element removed next', 'Element inserted next', 'Largest element', 'Middle element'], correctAnswer: 0 },
  ],
  'Trees & BST': [
    { question: 'In a BST, values in the left subtree are:', options: ['Less than root', 'Greater than root', 'Always equal', 'Unrelated'], correctAnswer: 0 },
    { question: 'Inorder traversal of a BST returns:', options: ['Sorted order', 'Random order', 'Level order', 'Only leaf nodes'], correctAnswer: 0 },
    { question: 'A node with no children is called:', options: ['Leaf', 'Root', 'Ancestor', 'Sibling'], correctAnswer: 0 },
    { question: 'Which traversal uses a queue for trees?', options: ['Level-order traversal', 'Inorder traversal', 'Postorder traversal', 'Preorder traversal only'], correctAnswer: 0 },
    { question: 'BST search average complexity in balanced case is:', options: ['O(log n)', 'O(1)', 'O(n^2)', 'O(n log n)'], correctAnswer: 0 },
  ],
  Graphs: [
    { question: 'Which traversal typically uses a queue?', options: ['BFS', 'DFS', 'Dijkstra', 'Prim'], correctAnswer: 0 },
    { question: 'DFS is commonly implemented using:', options: ['Stack or recursion', 'Queue', 'Heap', 'Hash map only'], correctAnswer: 0 },
    { question: 'Topological sorting is valid only for:', options: ['Directed acyclic graphs', 'All undirected graphs', 'Cyclic graphs', 'Complete graphs only'], correctAnswer: 0 },
    { question: 'For unweighted shortest path from a source, best choice is:', options: ['BFS', 'Kruskal', 'Floyd-Warshall', 'Prim'], correctAnswer: 0 },
    { question: 'What does an adjacency list store?', options: ['Neighbors for each vertex', 'Only edge weights', 'Only isolated nodes', 'Sorted paths to destination'], correctAnswer: 0 },
  ],
  Hashing: [
    { question: 'Average lookup time for a good hash table is:', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correctAnswer: 0 },
    { question: 'A collision in hashing means:', options: ['Two keys map to same index', 'Key is missing', 'Table is sorted', 'Hash function is recursive'], correctAnswer: 0 },
    { question: 'Which is a common collision handling strategy?', options: ['Chaining', 'Tree rotation', 'Backtracking', 'Dynamic programming'], correctAnswer: 0 },
    { question: 'What makes a hash function practical?', options: ['Uniform distribution and speed', 'Very long output only', 'Using recursion only', 'Avoiding modulus entirely'], correctAnswer: 0 },
    { question: 'In open addressing, probing is used to:', options: ['Find next available slot', 'Sort key-value pairs', 'Build a binary tree', 'Traverse graph layers'], correctAnswer: 0 },
  ],
  Aptitude: [
    { question: 'What is the best strategy to improve aptitude speed?', options: ['Timed practice plus review', 'Skip weak topics', 'Memorize without solving', 'Avoid mock tests'], correctAnswer: 0 },
    { question: 'If accuracy drops in mocks, what should you do first?', options: ['Analyze mistakes topic-wise', 'Increase guesses', 'Ignore wrong questions', 'Stop timed practice'], correctAnswer: 0 },
    { question: 'For percentage questions, first step should be:', options: ['Convert statements into base values', 'Memorize random answers', 'Skip unit checks', 'Assume all values are equal'], correctAnswer: 0 },
    { question: 'In time-and-work problems, a reliable approach is to use:', options: ['Work-rate equations', 'Probability trees only', 'Graph DFS', 'String hashing'], correctAnswer: 0 },
    { question: 'During aptitude tests, when should you skip a question?', options: ['When it exceeds planned time budget', 'Never skip any question', 'Only after exam ends', 'Only if options look easy'], correctAnswer: 0 },
  ],
  __default: [
    { question: 'Which learning strategy improves medium-level topic performance fastest?', options: ['Practice plus error analysis', 'Theory only', 'Guessing only', 'Skipping revision'], correctAnswer: 0 },
    { question: 'What do interviewers value most in technical answers?', options: ['Correct reasoning', 'Random keywords', 'Long responses only', 'Memorized scripts'], correctAnswer: 0 },
    { question: 'What should you do after a wrong answer?', options: ['Review and retry similar pattern', 'Ignore it', 'Avoid that topic forever', 'Blame time limit'], correctAnswer: 0 },
    { question: 'Which prep routine is strongest over one week?', options: ['Daily focused practice', 'One long session only', 'No timed drills', 'No revision'], correctAnswer: 0 },
    { question: 'How do you make practice transfer to real tests?', options: ['Use timed mocks with review', 'Read solutions only', 'Avoid mixed-topic sets', 'Skip weak areas'], correctAnswer: 0 },
  ],
};

const FLASHCARD_FALLBACK_BY_KEY = {
  dsa: [
    { term: 'Time Complexity', definition: 'How running time scales with input size, often expressed with Big-O.' },
    { term: 'Space Complexity', definition: 'How memory usage grows relative to input size.' },
    { term: 'Two Pointers', definition: 'Technique that moves two indices through data to reduce nested loops.' },
    { term: 'Sliding Window', definition: 'Method to maintain a moving range and update answers incrementally.' },
    { term: 'Recursion', definition: 'Function calling itself on smaller subproblems until a base case.' },
    { term: 'Dynamic Programming', definition: 'Solves overlapping subproblems using memoization or tabulation.' },
    { term: 'Greedy Choice', definition: 'Makes the best local decision at each step to reach a global solution.' },
    { term: 'Binary Search', definition: 'Halves the search range repeatedly on sorted data.' },
  ],
  graphs: [
    { term: 'Vertex', definition: 'A node in a graph representing an entity.' },
    { term: 'Edge', definition: 'A connection between two vertices.' },
    { term: 'BFS', definition: 'Layer-by-layer traversal that uses a queue.' },
    { term: 'DFS', definition: 'Depth-first traversal using recursion or a stack.' },
    { term: 'DAG', definition: 'Directed graph with no cycles.' },
    { term: 'Topological Sort', definition: 'Linear ordering of vertices in a DAG by dependency.' },
    { term: 'Adjacency List', definition: 'Representation storing neighbors for each vertex.' },
    { term: 'Connected Component', definition: 'Subgraph where each pair of vertices is reachable.' },
  ],
  hashing: [
    { term: 'Hash Function', definition: 'Maps a key to an index for fast lookup.' },
    { term: 'Collision', definition: 'Two different keys map to the same index.' },
    { term: 'Chaining', definition: 'Stores colliding keys together in a bucket list.' },
    { term: 'Open Addressing', definition: 'Finds alternate empty slots by probing.' },
    { term: 'Load Factor', definition: 'Ratio of stored entries to table capacity.' },
    { term: 'Rehashing', definition: 'Resizing and reinserting keys when table gets crowded.' },
    { term: 'Average Lookup', definition: 'Expected O(1) operation time for well-distributed keys.' },
    { term: 'Key Distribution', definition: 'Spread of keys across buckets that impacts performance.' },
  ],
  trees: [
    { term: 'Root', definition: 'Top node in a tree with no parent.' },
    { term: 'Leaf', definition: 'Node with no children.' },
    { term: 'BST', definition: 'Binary search tree with left < root < right ordering.' },
    { term: 'Inorder', definition: 'Traversal that visits left, root, then right.' },
    { term: 'Height', definition: 'Number of edges on the longest root-to-leaf path.' },
    { term: 'Balance', definition: 'How evenly tree nodes are distributed across levels.' },
    { term: 'Level Order', definition: 'Breadth-first traversal using a queue.' },
    { term: 'Subtree', definition: 'A node and all descendants beneath it.' },
  ],
  arrays: [
    { term: 'Index Access', definition: 'Reads array elements in constant time using position.' },
    { term: 'Contiguous Memory', definition: 'Array elements are typically stored in adjacent memory locations.' },
    { term: 'Two Sum', definition: 'Classic problem solved efficiently using a hash map.' },
    { term: 'Prefix Sum', definition: 'Precomputed cumulative sums for fast range queries.' },
    { term: 'In-place Update', definition: 'Modifies data without allocating significant extra space.' },
    { term: 'String Immutability', definition: 'In many languages, string edits create new values.' },
    { term: 'Substring', definition: 'Continuous slice of a string by start and end bounds.' },
    { term: 'Anagram Check', definition: 'Compares character frequency counts across two strings.' },
  ],
  linkedlist: [
    { term: 'Node', definition: 'Basic unit storing value and pointer(s).' },
    { term: 'Head', definition: 'First node of a linked list.' },
    { term: 'Tail', definition: 'Last node in the list.' },
    { term: 'Cycle Detection', definition: 'Finds loops using slow and fast pointers.' },
    { term: 'Dummy Node', definition: 'Helper node simplifying insert/delete edge cases.' },
    { term: 'Reverse List', definition: 'Rewires next pointers to invert list direction.' },
    { term: 'Singly Linked', definition: 'Each node points to next node only.' },
    { term: 'Doubly Linked', definition: 'Each node has previous and next pointers.' },
  ],
  stack: [
    { term: 'LIFO', definition: 'Last in, first out processing order.' },
    { term: 'Push', definition: 'Adds an element to the top of stack.' },
    { term: 'Pop', definition: 'Removes the top element from stack.' },
    { term: 'Peek', definition: 'Reads top element without removing it.' },
    { term: 'Call Stack', definition: 'Stores active function calls during execution.' },
    { term: 'Bracket Match', definition: 'Common stack application for parentheses validation.' },
    { term: 'Postfix Eval', definition: 'Evaluates reverse-polish expressions using stack operations.' },
    { term: 'Monotonic Stack', definition: 'Maintains ordered stack for next greater/smaller problems.' },
  ],
  queue: [
    { term: 'FIFO', definition: 'First in, first out processing order.' },
    { term: 'Enqueue', definition: 'Adds an element to the rear of queue.' },
    { term: 'Dequeue', definition: 'Removes an element from the front of queue.' },
    { term: 'Front', definition: 'Element that will be removed next.' },
    { term: 'Rear', definition: 'Position where new elements are inserted.' },
    { term: 'Circular Queue', definition: 'Queue implementation that reuses freed positions.' },
    { term: 'Deque', definition: 'Double-ended queue supporting both-end operations.' },
    { term: 'BFS Queue', definition: 'Queue that processes graph/tree nodes level by level.' },
  ],
  aptitude: [
    { term: 'Percentage', definition: 'Represents value per hundred and helps compare magnitudes.' },
    { term: 'Ratio', definition: 'Compares two quantities as a proportion.' },
    { term: 'Average', definition: 'Sum of values divided by count of values.' },
    { term: 'Time and Work', definition: 'Uses work rates to combine individual productivity.' },
    { term: 'Profit and Loss', definition: 'Relates selling price, cost price, and margin.' },
    { term: 'Speed Distance Time', definition: 'Connects motion values with d = s x t.' },
    { term: 'Logical Deduction', definition: 'Draws valid conclusions from given statements.' },
    { term: 'Data Interpretation', definition: 'Extracts conclusions from charts, tables, and graphs.' },
  ],
  placements: [
    { term: 'Resume Impact', definition: 'Quantified outcomes in project bullets improve recruiter clarity.' },
    { term: 'Aptitude Round', definition: 'Evaluates quantitative, verbal, and logical reasoning skills.' },
    { term: 'Coding Round', definition: 'Tests problem solving, data structures, and code correctness.' },
    { term: 'HR Round', definition: 'Assesses communication, motivation, and role fit.' },
    { term: 'Mock Interview', definition: 'Practice interview that reveals gaps before final rounds.' },
    { term: 'Behavioral Question', definition: 'Scenario-based prompt to evaluate teamwork and ownership.' },
    { term: 'Time Management', definition: 'Allocates fixed minutes per section to maximize score.' },
    { term: 'Error Review', definition: 'Post-test analysis used to improve weak topics quickly.' },
  ],
  __default: [
    { term: 'Fundamentals', definition: 'Core principles that support higher-level problem solving.' },
    { term: 'Practice Loop', definition: 'Cycle of solve, review, and retry to retain learning.' },
    { term: 'Mistake Analysis', definition: 'Identifying root causes of incorrect answers to avoid repeats.' },
    { term: 'Timeboxing', definition: 'Fixed time limits per problem to improve exam pacing.' },
    { term: 'Concept Clarity', definition: 'Understanding why a method works, not only memorizing steps.' },
    { term: 'Pattern Recognition', definition: 'Mapping new questions to familiar solution templates.' },
    { term: 'Revision Cycle', definition: 'Planned review intervals that reinforce memory.' },
    { term: 'Confidence Tracking', definition: 'Measuring readiness by topic using mock performance.' },
  ],
};

const textKey = (value = '') => String(value).toLowerCase().replace(/\s+/g, ' ').trim();

const toOptionText = (option) => {
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'number') return String(option);
  if (option && typeof option === 'object') {
    return String(option.text || option.option || option.value || option.label || '').trim();
  }
  return '';
};

const toUniqueOptions = (rawOptions) => {
  let options = [];

  if (Array.isArray(rawOptions)) {
    options = rawOptions.map(toOptionText).filter(Boolean);
  } else if (rawOptions && typeof rawOptions === 'object') {
    options = Object.keys(rawOptions)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => toOptionText(rawOptions[key]))
      .filter(Boolean);
  }

  const unique = [];
  const seen = new Set();
  options.forEach((opt) => {
    const key = textKey(opt);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(opt);
  });

  return unique;
};

const normalizeCorrectIndex = (rawCorrect, options) => {
  if (typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect < options.length) {
    return rawCorrect;
  }

  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber < options.length) {
      return asNumber;
    }

    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    const letter = letterMap[trimmed.toUpperCase()];
    if (typeof letter === 'number' && letter < options.length) {
      return letter;
    }

    const byText = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (byText !== -1) {
      return byText;
    }
  }

  return 0;
};

const fallbackOptionPool = (topic) => [
  `Most accurate ${topic} principle`,
  `Common mistake in ${topic}`,
  `Partially correct ${topic} statement`,
  `Irrelevant distractor about ${topic}`,
];

const sanitizeOptions = (rawOptions, topic) => {
  let cleaned = toUniqueOptions(rawOptions);
  if (cleaned.length && cleaned.every((opt) => OPTION_PLACEHOLDER_REGEX.test(opt))) {
    cleaned = [];
  }

  const fillers = fallbackOptionPool(topic);
  let fillerIndex = 0;
  while (cleaned.length < 4) {
    const candidate = fillers[fillerIndex % fillers.length];
    fillerIndex += 1;
    if (!cleaned.some((item) => textKey(item) === textKey(candidate))) {
      cleaned.push(candidate);
    }
  }

  return cleaned.slice(0, 4);
};

const getSpinFallbackQuestions = (topic) => {
  const topicSet = SPIN_TOPIC_FALLBACKS[topic] || SPIN_TOPIC_FALLBACKS.__default;
  return topicSet.slice(0, 5).map((q, idx) => ({
    id: `spin-fallback-${idx + 1}`,
    question: q.question,
    options: q.options.slice(0, 4),
    correctAnswer: q.correctAnswer,
  }));
};

const sanitizeSpinQuestions = (rawQuestions, topic, targetCount = 5) => {
  const items = Array.isArray(rawQuestions) ? rawQuestions : [];
  const unique = [];
  const seenQuestions = new Set();

  items.forEach((raw, idx) => {
    const questionText = String(raw?.question || raw?.prompt || raw?.text || '').trim();
    const qKey = textKey(questionText);
    if (!qKey || seenQuestions.has(qKey) || SPIN_QUESTION_TEMPLATE_REGEX.test(questionText)) return;

    const options = toUniqueOptions(raw?.options || raw?.choices || raw?.answers || []).slice(0, 4);
    if (options.length < 4) return;

    const hasPlaceholder = options.some((opt) => OPTION_PLACEHOLDER_REGEX.test(opt));
    const hasTemplateOption = options.some((opt) => SPIN_OPTION_TEMPLATE_REGEX.test(opt));
    if (hasPlaceholder || hasTemplateOption) return;

    const correctAnswer = normalizeCorrectIndex(
      raw?.correctAnswer ?? raw?.answer ?? raw?.correct_option ?? raw?.correctOption,
      options
    );

    seenQuestions.add(qKey);
    unique.push({
      id: raw?.id || raw?._id || idx + 1,
      question: questionText,
      options,
      correctAnswer,
    });
  });

  const merged = [...unique];
  const fallback = getSpinFallbackQuestions(topic);
  for (let i = 0; merged.length < targetCount && i < fallback.length; i += 1) {
    const candidate = fallback[i];
    const key = textKey(candidate.question);
    if (seenQuestions.has(key)) continue;
    seenQuestions.add(key);
    merged.push(candidate);
  }

  return merged.slice(0, targetCount);
};

const resolveFlashcardKey = (topic) => {
  const t = textKey(topic);
  if (t.includes('graph')) return 'graphs';
  if (t.includes('hash')) return 'hashing';
  if (t.includes('tree') || t.includes('bst')) return 'trees';
  if (t.includes('array') || t.includes('string')) return 'arrays';
  if (t.includes('linked')) return 'linkedlist';
  if (t.includes('stack')) return 'stack';
  if (t.includes('queue')) return 'queue';
  if (t.includes('aptitude')) return 'aptitude';
  if (t.includes('placement')) return 'placements';
  if (t.includes('dsa')) return 'dsa';
  return '__default';
};

const getFlashcardFallbackCards = (topic) => {
  const key = resolveFlashcardKey(topic);
  const primary = FLASHCARD_FALLBACK_BY_KEY[key] || [];
  const generic = FLASHCARD_FALLBACK_BY_KEY.__default || [];

  const merged = [];
  const seen = new Set();
  [...primary, ...generic].forEach((card, idx) => {
    const term = String(card.term || '').trim();
    const definition = String(card.definition || '').trim();
    const dedupeKey = `${textKey(term)}|${textKey(definition)}`;
    if (!term || !definition || seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    merged.push({
      id: `flash-fallback-${idx + 1}`,
      term,
      definition,
    });
  });

  return merged.slice(0, 8);
};

const sanitizeMcqList = (rawQuestions, topic, targetCount = 5, difficultyLabel = 'medium') => {
  const items = Array.isArray(rawQuestions) ? rawQuestions : [];
  const unique = [];
  const seenQuestions = new Set();

  items.forEach((raw, idx) => {
    const questionText = String(raw?.question || raw?.prompt || raw?.text || '').trim();
    const key = textKey(questionText);
    if (!key || seenQuestions.has(key)) return;

    const options = sanitizeOptions(raw?.options || raw?.choices || raw?.answers || [], topic);
    if (options.length < 4) return;

    const correctAnswer = normalizeCorrectIndex(
      raw?.correctAnswer ?? raw?.answer ?? raw?.correct_option ?? raw?.correctOption,
      options
    );

    seenQuestions.add(key);
    unique.push({
      id: raw?.id || raw?._id || idx + 1,
      question: questionText,
      options,
      correctAnswer,
    });
  });

  const fallbackQuestions = Array.from({ length: Math.max(targetCount, 4) }).map((_, idx) => ({
    id: `fallback-${difficultyLabel}-${idx + 1}`,
    question: `${difficultyLabel[0].toUpperCase() + difficultyLabel.slice(1)} ${topic} question ${idx + 1}: choose the best answer.`,
    options: sanitizeOptions([], topic),
    correctAnswer: 0,
  }));

  const merged = [...unique];
  for (let i = 0; merged.length < targetCount; i += 1) {
    const candidate = fallbackQuestions[i % fallbackQuestions.length];
    const key = textKey(candidate.question);
    if (!seenQuestions.has(key)) {
      merged.push(candidate);
      seenQuestions.add(key);
    }
  }

  return merged.slice(0, targetCount);
};

const sanitizeFlashcards = (rawCards, topic) => {
  const cards = Array.isArray(rawCards) ? rawCards : [];
  const unique = [];
  const seen = new Set();

  cards.forEach((card, idx) => {
    const term = String(card?.term || card?.question || card?.title || '').trim();
    const definition = String(card?.definition || card?.answer || card?.explanation || '').trim();
    if (!term || !definition) return;
    if (FLASHCARD_TERM_TEMPLATE_REGEX.test(term)) return;
    if (FLASHCARD_DEFINITION_TEMPLATE_REGEX.test(definition)) return;
    if (/core concept in\s+/i.test(definition)) return;
    if (definition.split(/\s+/).filter(Boolean).length < 4) return;
    const key = `${textKey(term)}|${textKey(definition)}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({
      id: card?.id || idx + 1,
      term,
      definition,
    });
  });

  const fallback = getFlashcardFallbackCards(topic);

  const merged = [...unique];
  for (let i = 0; merged.length < 8 && i < fallback.length; i += 1) {
    const candidate = fallback[i];
    const key = `${textKey(candidate.term)}|${textKey(candidate.definition)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(candidate);
  }

  return merged.slice(0, 8);
};

const sanitizeBossBattleQuestions = (rawBoss, topic) => {
  const phases = Array.isArray(rawBoss?.phases) ? rawBoss.phases : [];

  return {
    phases: ['Easy', 'Medium', 'Hard'].map((phaseName, phaseIndex) => {
      const found = phases.find((p) => textKey(p?.name) === textKey(phaseName)) || phases[phaseIndex] || {};
      const count = BOSS_PHASE_TARGETS[phaseName];
      return {
        name: phaseName,
        questions: sanitizeMcqList(found?.questions, topic, count, phaseName.toLowerCase()),
      };
    }),
  };
};

const sanitizeQuestionsByType = (gameType, questions, topic) => {
  switch (gameType) {
    case 'sprint':
      return sanitizeMcqList(questions, topic, 5, 'easy');
    case 'spin':
      return sanitizeSpinQuestions(questions, topic, 5);
    case 'flashcards':
      return sanitizeFlashcards(questions, topic);
    case 'boss_battle':
      return sanitizeBossBattleQuestions(questions, topic);
    default:
      return questions;
  }
};

const toStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const updateDailyStreak = (profile) => {
  const today = toStartOfDay(new Date());

  if (!profile.lastActivityDate) {
    profile.streakDays = 1;
    profile.lastActivityDate = new Date();
    return;
  }

  const lastDay = toStartOfDay(profile.lastActivityDate);
  const dayDiff = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff <= 0) {
    return;
  }

  if (dayDiff === 1) {
    profile.streakDays = (profile.streakDays || 0) + 1;
  } else {
    profile.streakDays = 1;
  }

  profile.lastActivityDate = new Date();
};

// @desc    Initialize or get gamification profile for user
export const getOrCreateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let profile = await GamificationProfile.findOne({ userId });

  if (!profile) {
    profile = await GamificationProfile.create({ userId });
  }

  const totalXp = Number(profile.totalXp || 0);
  const derivedLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpProgress = totalXp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL - xpProgress;

  res.json({
    totalXp,
    level: derivedLevel,
    streakDays: profile.streakDays,
    badges: profile.badges || [],
    xpProgress,
    xpForNextLevel,
    xpPerLevel: XP_PER_LEVEL,
  });
});

// @desc    Get stage progress for a specific domain
export const getStageProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain } = req.query;

  if (!domain || !['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid or missing domain');
  }

  const stages = await StageProgress.find({ userId, domain });

  // Ensure all 4 stages exist
  const stageMap = {};
  for (let i = 1; i <= 4; i++) {
    const stage = stages.find((s) => s.stageId === i);
    stageMap[i] = stage || {
      userId,
      domain,
      stageId: i,
      completedGames: 0,
      progress: 0,
    };
  }

  res.json({
    domain,
    stages: Object.values(stageMap),
  });
});

// @desc    Complete a game and award XP
export const completeGame = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain, stageId, gameType, topicName, score, totalQuestions } = req.body;

  // Validation
  if (!domain || !['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid domain');
  }
  if (!stageId || stageId < 1 || stageId > 4) {
    res.status(400);
    throw new Error('Invalid stage ID');
  }
  if (!gameType || !['sprint', 'spin', 'flashcards', 'boss_battle'].includes(gameType)) {
    res.status(400);
    throw new Error('Invalid game type');
  }

  // Get or create gamification profile
  let profile = await GamificationProfile.findOne({ userId });
  if (!profile) {
    profile = await GamificationProfile.create({ userId });
  }

  // Get or create stage progress
  let stageProgress = await StageProgress.findOne({ userId, domain, stageId });
  if (!stageProgress) {
    stageProgress = await StageProgress.create({ userId, domain, stageId });
  }

  // Calculate XP earned
  const xpEarned = XP_REWARDS[gameType] || 100;
  const passed =
    gameType === 'boss_battle'
      ? true
      : score >= (totalQuestions ? Math.ceil(totalQuestions * 0.6) : 3);

  // A game can award XP only once per user+domain+stage+gameType.
  const completedGameTypes = await XPLog.distinct('source', {
    userId,
    domain,
    stageId,
    xpAmount: { $gt: 0 },
  });
  const hasCompletedThisGame = completedGameTypes.includes(gameType);

  let xpGiven = 0;
  if (passed) {
    const streakBefore = profile.streakDays || 0;
    updateDailyStreak(profile);

    if (!hasCompletedThisGame) {
      xpGiven = xpEarned;
      profile.totalXp += xpEarned;
      profile.level = Math.floor(profile.totalXp / XP_PER_LEVEL) + 1;

      // Log XP transaction (first-time completion only)
      await XPLog.create({
        userId,
        source: gameType,
        domain,
        stageId,
        topicName,
        xpAmount: xpEarned,
      });
    }

    if (
      xpGiven > 0 ||
      (profile.streakDays || 0) !== streakBefore ||
      !profile.lastActivityDate
    ) {
      await profile.save();
    }
  }

  // Stage completion is based on unique minigames completed, not replay count.
  const uniqueCompletedCount = Math.min(
    4,
    completedGameTypes.length + (passed && !hasCompletedThisGame ? 1 : 0)
  );
  const normalizedProgress = (uniqueCompletedCount / 4) * 100;

  if (
    stageProgress.completedGames !== uniqueCompletedCount ||
    stageProgress.progress !== normalizedProgress
  ) {
    stageProgress.completedGames = uniqueCompletedCount;
    stageProgress.progress = normalizedProgress;
    await stageProgress.save();
  }

  // Log performance metrics
  await PerformanceLog.create({
    userId,
    domain,
    gameType,
    topic: topicName,
    stageId,
    score: score || 0,
    accuracy: totalQuestions ? (score / totalQuestions) * 100 : 0,
    passed,
    xpAwarded: xpGiven,
  });

  const xpForNextLevel = XP_PER_LEVEL - (profile.totalXp % XP_PER_LEVEL);
  const xpProgress = profile.totalXp % XP_PER_LEVEL;

  res.json({
    success: true,
    xpEarned: xpGiven,
    totalXp: profile.totalXp,
    level: profile.level,
    xpProgress,
    xpForNextLevel,
    stageProgress: {
      stageId,
      completedGames: stageProgress.completedGames,
      progress: stageProgress.progress,
    },
  });
});

// @desc    Get or generate questions for a game
export const getQuestions = asyncHandler(async (req, res) => {
  const { domain, topic, gameType } = req.query;

  // Validation
  if (!domain || !topic || !gameType) {
    res.status(400);
    throw new Error('Missing domain, topic, or gameType');
  }

  if (!['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid domain');
  }

  if (!['sprint', 'spin', 'flashcards', 'boss_battle'].includes(gameType)) {
    res.status(400);
    throw new Error('Invalid game type');
  }

  // Check if cached (skip boss cache so quality improvements apply immediately)
  const shouldUseCache = gameType !== 'boss_battle';
  let cached = shouldUseCache ? await QuestionCache.findOne({ domain, topic, gameType }) : null;
  if (cached) {
    const sanitizedCached = sanitizeQuestionsByType(gameType, cached.questions, topic);

    if (JSON.stringify(sanitizedCached) !== JSON.stringify(cached.questions)) {
      try {
        cached.questions = sanitizedCached;
        cached.createdAt = new Date();
        await cached.save();
      } catch (cacheRepairErr) {
        console.error('Cache repair error (non-blocking):', cacheRepairErr);
      }
    }

    return res.json({
      questions: sanitizedCached,
      cached: true,
    });
  }

  // Generate new questions
  let questions;
  try {
    switch (gameType) {
      case 'sprint':
        questions = await generateSprintQuestions(domain, topic);
        break;
      case 'flashcards':
        questions = await generateFlashcards(domain, topic);
        break;
      case 'boss_battle':
        questions = await generateBossBattleQuestions(domain, topic);
        break;
      case 'spin':
        questions = await generateSpinQuestions(domain, topic);
        break;
      default:
        questions = [];
    }
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500);
    throw new Error('Failed to generate questions');
  }

  const sanitizedQuestions = sanitizeQuestionsByType(gameType, questions, topic);

  // Cache the result
  try {
    await QuestionCache.findOneAndUpdate(
      { domain, topic, gameType },
      { questions: sanitizedQuestions, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (cacheErr) {
    console.error('Cache error (non-blocking):', cacheErr);
  }

  res.json({
    questions: sanitizedQuestions,
    cached: false,
  });
});

// @desc    Get domain topics for a stage
export const getDomainTopics = asyncHandler(async (req, res) => {
  const { domain, stageId } = req.query;

  if (!domain || !stageId) {
    res.status(400);
    throw new Error('Missing domain or stageId');
  }

  const topics = await generateDomainTopics(domain, parseInt(stageId));

  res.json({
    domain,
    stageId: parseInt(stageId),
    topics,
  });
});

// @desc    Get user's weekly leaderboard rank
export const getLeaderboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 10, domain } = req.query;

  // Calculate week start date
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // Aggregate XP from this week
  const leaderboardAgg = await XPLog.aggregate([
    {
      $match: {
        createdAt: { $gte: weekStart },
        ...(domain && { domain }),
      },
    },
    {
      $group: {
        _id: '$userId',
        weeklyXp: { $sum: '$xpAmount' },
      },
    },
    {
      $sort: { weeklyXp: -1 },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
  ]);

  const leaders = await Promise.all(
    leaderboardAgg.map(async (entry, index) => {
      const profile = await GamificationProfile.findOne({ userId: entry._id });
      const totalXp = Number(profile?.totalXp || 0);
      return {
        rank: index + 1,
        userId: entry._id,
        name: entry.userInfo[0]?.name || 'Unknown',
        profileImage: entry.userInfo[0]?.profileImage || '',
        level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
        weeklyXp: entry.weeklyXp,
        isCurrentUser: entry._id.toString() === userId.toString(),
      };
    })
  );

  // Find current user's rank if not in top 10
  let currentUserRank = leaders.find((l) => l.isCurrentUser);
  if (!currentUserRank) {
    const allLeaderboard = await XPLog.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
          ...(domain && { domain }),
        },
      },
      {
        $group: {
          _id: '$userId',
          weeklyXp: { $sum: '$xpAmount' },
        },
      },
      {
        $sort: { weeklyXp: -1 },
      },
    ]);

    const userRankIndex = allLeaderboard.findIndex((e) => e._id.toString() === userId.toString());
    if (userRankIndex !== -1) {
      const profile = await GamificationProfile.findOne({ userId });
      const totalXp = Number(profile?.totalXp || 0);
      const user = await User.findById(userId);
      currentUserRank = {
        rank: userRankIndex + 1,
        userId,
        name: user?.name || 'You',
        profileImage: user?.profileImage || '',
        level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
        weeklyXp: allLeaderboard[userRankIndex].weeklyXp,
        isCurrentUser: true,
      };
    }
  }

  res.json({
    period: 'weekly',
    leaders,
    currentUser: currentUserRank || null,
  });
});

// @desc    Record a spin wheel reward
export const recordSpinReward = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain, rewardType, rewardValue } = req.body;

  if (!domain || !rewardType) {
    res.status(400);
    throw new Error('Missing domain or rewardType');
  }

  const reward = await SpinReward.create({
    userId,
    domain,
    rewardType,
    rewardValue: rewardValue || 'unlocked',
  });

  res.json({
    success: true,
    reward,
  });
});

// @desc    Get user's badges
export const getBadges = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await GamificationProfile.findOne({ userId });

  // Predefined badge definitions
  const allBadges = [
    { id: 'first_steps', name: 'First Steps', description: 'Complete your first game', icon: '👣' },
    {
      id: 'streak_3',
      name: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
    },
    {
      id: 'level_10',
      name: 'Expert',
      description: 'Reach level 10',
      icon: '🏆',
    },
    {
      id: 'all_games',
      name: 'Game Master',
      description: 'Complete all 4 game types',
      icon: '🎮',
    },
    {
      id: 'domain_master',
      name: 'Domain Champion',
      description: 'Complete all 4 stages in a domain',
      icon: '👑',
    },
  ];

  const unlockedIds = (profile?.badges || []).map((b) => b.name);
  const badges = allBadges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    unlocked: unlockedIds.includes(badge.name),
    unlockedAt: profile?.badges?.find((b) => b.name === badge.name)?.unlockedAt || null,
  }));

  res.json({ badges });
});
