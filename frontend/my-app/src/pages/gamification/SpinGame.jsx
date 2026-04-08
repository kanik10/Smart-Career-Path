import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import './SpinGame.css';

const QUIZ_DURATION = 60;
const QUESTION_COUNT = 5;
const PASS_SCORE = 3;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_PLACEHOLDER_REGEX = /^option\s*[a-f0-9]*$/i;

const questionKey = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const dedupeQuestions = (questions) => {
  const seen = new Set();
  const unique = [];

  questions.forEach((q) => {
    const key = questionKey(q?.question);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(q);
  });

  return unique;
};

const TOPIC_FALLBACKS = {
  'Arrays & Strings': [
    {
      question: 'What is the time complexity to access arr[i] in an array?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 0,
    },
    {
      question: 'Which technique is commonly used to reverse a string in-place?',
      options: ['Two pointers', 'Binary search', 'Greedy', 'BFS'],
      correctAnswer: 0,
    },
    {
      question: 'What does sliding window usually optimize?',
      options: ['Nested loop checks on subarrays', 'Tree balancing', 'Heap insertion', 'Graph coloring'],
      correctAnswer: 0,
    },
  ],
  'Linked List': [
    {
      question: 'Which operation is O(1) in singly linked list when head is known?',
      options: ['Insert at head', 'Search by value', 'Access by index', 'Find tail'],
      correctAnswer: 0,
    },
    {
      question: 'Which pointer technique helps detect a cycle?',
      options: ['Slow and fast pointers', 'Prefix sums', 'Monotonic stack', 'Trie walk'],
      correctAnswer: 0,
    },
    {
      question: 'In a doubly linked list, each node stores:',
      options: ['prev and next pointers', 'only next pointer', 'child pointer', 'hash index'],
      correctAnswer: 0,
    },
  ],
  Stack: [
    {
      question: 'Stack follows which order?',
      options: ['LIFO', 'FIFO', 'Random', 'Priority'],
      correctAnswer: 0,
    },
    {
      question: 'What does pop do?',
      options: ['Removes top element', 'Adds top element', 'Views top only', 'Sorts stack'],
      correctAnswer: 0,
    },
    {
      question: 'Which is a common stack use-case?',
      options: ['Undo operations', 'Level-order traversal', 'CPU load balancing', 'Hash collision handling'],
      correctAnswer: 0,
    },
  ],
  Queue: [
    {
      question: 'Queue follows which order?',
      options: ['FIFO', 'LIFO', 'Random', 'Sorted'],
      correctAnswer: 0,
    },
    {
      question: 'Which operation inserts into queue?',
      options: ['Enqueue', 'Pop', 'Peek', 'PushFront'],
      correctAnswer: 0,
    },
    {
      question: 'BFS traversal uses:',
      options: ['Queue', 'Stack', 'Heap', 'Trie'],
      correctAnswer: 0,
    },
  ],
  'Trees & BST': [
    {
      question: 'In a BST, left subtree values are:',
      options: ['Less than root', 'Greater than root', 'Equal only', 'Unrelated'],
      correctAnswer: 0,
    },
    {
      question: 'Inorder traversal of BST gives:',
      options: ['Sorted order', 'Reverse sorted always', 'Level order', 'Random order'],
      correctAnswer: 0,
    },
    {
      question: 'A node with no children is called:',
      options: ['Leaf', 'Root', 'Ancestor', 'Sibling'],
      correctAnswer: 0,
    },
  ],
  'Graphs': [
    {
      question: 'Which traversal uses a queue?',
      options: ['BFS', 'DFS', 'Dijkstra', 'Prim'],
      correctAnswer: 0,
    },
    {
      question: 'DFS is commonly implemented with:',
      options: ['Stack/recursion', 'Queue', 'Heap', 'Hash map'],
      correctAnswer: 0,
    },
    {
      question: 'Topological sort applies to:',
      options: ['DAG', 'Undirected graph', 'Complete graph', 'Any cyclic graph'],
      correctAnswer: 0,
    },
  ],
  'Hashing': [
    {
      question: 'Average lookup time for hash table is:',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      correctAnswer: 0,
    },
    {
      question: 'Collision means:',
      options: ['Two keys map to same index', 'Table is empty', 'No key exists', 'Array is sorted'],
      correctAnswer: 0,
    },
    {
      question: 'Which is a collision handling method?',
      options: ['Chaining', 'Tree rotation', 'Backtracking', 'Memoization'],
      correctAnswer: 0,
    },
  ],
  'Aptitude': [
    {
      question: 'What is the best strategy for aptitude speed improvement?',
      options: ['Timed practice and error review', 'Skip weak topics', 'Memorize without solving', 'Only read formulas'],
      correctAnswer: 0,
    },
    {
      question: 'For placement aptitude, first step should be:',
      options: ['Master fundamentals and shortcuts', 'Attempt hardest only', 'Avoid arithmetic', 'Ignore mock tests'],
      correctAnswer: 0,
    },
    {
      question: 'If accuracy drops in mocks, you should:',
      options: ['Analyze mistakes by topic', 'Increase guesses', 'Skip analysis', 'Stop timed tests'],
      correctAnswer: 0,
    },
  ],
};

const WHEEL_TOPICS = [
  'Arrays & Strings',
  'Linked List',
  'Stack',
  'Queue',
  'Trees & BST',
  'Graphs',
  'Hashing',
  'Aptitude',
];

const WHEEL_COLORS = ['#1f7ec8', '#215f9f', '#f0bf2f', '#5db53d', '#10b070', '#7a3bc9', '#be1f25', '#de7a10'];
const POINTER_ANGLE_DEGREES = 0; // Pointer is positioned at the right side of the wheel.

const toOptionText = (option) => {
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'number') return String(option);
  if (option && typeof option === 'object') return String(option.text || option.option || option.value || option.label || '').trim();
  return '';
};

const toCorrectIndex = (rawCorrect, options) => {
  if (typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect < options.length) return rawCorrect;
  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber < options.length) return asNumber;
    const letterIndex = OPTION_LABELS.indexOf(trimmed.toUpperCase());
    if (letterIndex !== -1 && letterIndex < options.length) return letterIndex;
    const byText = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (byText !== -1) return byText;
  }
  return 0;
};

const normalizeQuestion = (question, idx, topic) => {
  const questionText = String(question?.question || question?.prompt || question?.text || '').trim();
  if (!questionText) return null;

  const rawOptions = question?.options || question?.choices || question?.answers || [];
  let options = [];

  if (Array.isArray(rawOptions)) {
    options = rawOptions.map(toOptionText).filter(Boolean);
  } else if (rawOptions && typeof rawOptions === 'object') {
    options = Object.keys(rawOptions)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => toOptionText(rawOptions[key]))
      .filter(Boolean);
  }

  if (options.length < 2) return null;

  const placeholderCount = options.filter((opt) => OPTION_PLACEHOLDER_REGEX.test(opt)).length;
  if (placeholderCount >= 2) {
    const fallbackSet = TOPIC_FALLBACKS[topic] || TOPIC_FALLBACKS.Aptitude;
    const replacement = fallbackSet[idx % fallbackSet.length]?.options || [];
    if (replacement.length >= 4) {
      options = replacement.slice(0, 4);
    }
  }

  while (options.length < 4) {
    options.push('None of the above');
  }

  const correctAnswer = toCorrectIndex(
    question?.correctAnswer ?? question?.answer ?? question?.correct_option ?? question?.correctOption,
    options
  );

  return {
    id: question?.id || question?._id || idx + 1,
    question: questionText,
    options: options.slice(0, 4),
    correctAnswer,
  };
};

const randomizeQuestionOptions = (question) => {
  const pool = question.options.map((text, index) => ({ text, isCorrect: index === question.correctAnswer }));
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    ...question,
    options: pool.map((item) => item.text),
    correctAnswer: pool.findIndex((item) => item.isCorrect),
  };
};

const makeTopicFillers = (topic) => [
  {
    question: `Which statement about ${topic} is most accurate for placement interviews?`,
    options: ['Focus on concepts and one practical example', 'Skip fundamentals', 'Memorize random facts only', 'Avoid problem solving'],
    correctAnswer: 0,
  },
  {
    question: `What is the best way to improve in ${topic} within a week?`,
    options: ['Daily practice with review of mistakes', 'Practice only once', 'Read answers without solving', 'Ignore timed tests'],
    correctAnswer: 0,
  },
  {
    question: `In a ${topic} question, what do interviewers value most?`,
    options: ['Clear reasoning and correct approach', 'Fast guessing', 'Memorized wording only', 'Very long answers'],
    correctAnswer: 0,
  },
  {
    question: `For ${topic}, what should you do after a wrong answer?`,
    options: ['Analyze and retry the same pattern', 'Skip analysis', 'Blame difficulty', 'Avoid that topic'],
    correctAnswer: 0,
  },
  {
    question: `Which plan is best for medium-level ${topic} prep?`,
    options: ['Mix concept revision with targeted practice', 'Only theory with no practice', 'Only advanced problems', 'No revision'],
    correctAnswer: 0,
  },
];

const getFallbackQuestions = (topic) => {
  const base = TOPIC_FALLBACKS[topic] || TOPIC_FALLBACKS['Aptitude'];
  const fillers = makeTopicFillers(topic);
  const prepared = dedupeQuestions([...base, ...fillers]).slice(0, QUESTION_COUNT);

  const withIds = prepared.map((q, i) => ({
    ...q,
    id: `fallback-${topic}-${i + 1}`,
  }));

  return withIds.map((q) => randomizeQuestionOptions(q));
};

export default function SpinGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { domain = 'placements', stageId = 1 } = location.state || {};

  const [view, setView] = useState('intro'); // intro, wheel, countdown, quiz, result
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [xpEarned, setXpEarned] = useState(0);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);

  const scoreRef = useRef(0);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const lastTopicRef = useRef('');

  useEffect(() => {
    if (view !== 'quiz') return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [view, timeLeft]);

  useEffect(() => {
    if (view !== 'countdown') return;
    if (countdown <= 0) {
      setView('quiz');
      return;
    }

    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, view]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const segmentAngle = 360 / WHEEL_TOPICS.length;

  const getTopicFromWheelRotation = useCallback(
    (absoluteRotation) => {
      const normalizedRotation = ((absoluteRotation % 360) + 360) % 360;
      const pointerRelativeAngle = (POINTER_ANGLE_DEGREES - normalizedRotation + 360) % 360;
      const normalizedWithOffset = (pointerRelativeAngle + 90) % 360;
      const index = Math.floor((normalizedWithOffset + 0.0001) / segmentAngle) % WHEEL_TOPICS.length;
      return WHEEL_TOPICS[index];
    },
    [segmentAngle]
  );

  const loadQuestionsForTopic = async (topic) => {
    try {
      setError(null);
      const data = await gamificationService.getSpinQuestion(domain, topic);
      const normalized = Array.isArray(data)
        ? data
          .map((q, idx) => normalizeQuestion(q, idx, topic))
          .filter(Boolean)
        : [];

      const uniqueNormalized = dedupeQuestions(normalized);

      if (uniqueNormalized.length >= QUESTION_COUNT) {
        setQuestions(uniqueNormalized.slice(0, QUESTION_COUNT).map((q) => randomizeQuestionOptions(q)));
      } else {
        const fallback = getFallbackQuestions(topic);
        const merged = dedupeQuestions([...uniqueNormalized, ...fallback])
          .slice(0, QUESTION_COUNT)
          .map((q) => randomizeQuestionOptions(q));
        setQuestions(merged);
        setError('Duplicate or partial live questions were replaced with unique medium fallback questions.');
      }
    } catch (err) {
      console.error('Spin questions fetch failed:', err);
      setQuestions(getFallbackQuestions(topic));
      setError('Live questions failed to load, so fallback medium questions were used.');
    }
  };

  const handleSpin = async () => {
    if (spinning) return;

    setSpinning(true);
    submittedRef.current = false;
    setXpEarned(0);

    let randomIndex = Math.floor(Math.random() * WHEEL_TOPICS.length);
    if (WHEEL_TOPICS.length > 1 && WHEEL_TOPICS[randomIndex] === lastTopicRef.current) {
      randomIndex = (randomIndex + 1 + Math.floor(Math.random() * (WHEEL_TOPICS.length - 1))) % WHEEL_TOPICS.length;
    }
    const fullSpins = 5;
    const finalLandingAngle = randomIndex * segmentAngle + segmentAngle / 2;
    const desiredStopAngle = ((90 - finalLandingAngle) % 360 + 360) % 360;
    const normalizedCurrent = ((rotation % 360) + 360) % 360;
    const delta = (desiredStopAngle - normalizedCurrent + 360) % 360;
    const targetRotation = rotation + fullSpins * 360 + delta;
    const landingTopic = getTopicFromWheelRotation(targetRotation);

    lastTopicRef.current = landingTopic;

    setRotation(targetRotation);

    setTimeout(async () => {
      setSelectedTopic(landingTopic);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      scoreRef.current = 0;
      setScore(0);
      setTimeLeft(QUIZ_DURATION);
      await loadQuestionsForTopic(landingTopic);
      setCountdown(3);
      setView('countdown');
      setSpinning(false);
    }, 3000);
  };

  const pickAnswer = (optionIndex) => {
    if (selectedAnswer !== null || view !== 'quiz') return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSelectedAnswer(optionIndex);

    if (optionIndex === currentQuestion.correctAnswer) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((idx) => idx + 1);
        setSelectedAnswer(null);
      } else {
        finishGame();
      }
    }, 650);
  };

  const finishGame = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const finalScore = scoreRef.current;
    setScore(finalScore);

    let awardedXp = 0;
    if (finalScore >= PASS_SCORE && !submittedRef.current) {
      submittedRef.current = true;
      try {
        const response = await gamificationService.completeGame({
          domain,
          stageId,
          gameType: 'spin',
          topicName: selectedTopic,
          score: finalScore,
          totalQuestions: questions.length || QUESTION_COUNT,
        });
        awardedXp = response?.xpEarned || 0;
      } catch (err) {
        console.error('Spin completeGame failed:', err);
      }
    }

    setXpEarned(awardedXp);
    setView('result');
  }, [domain, questions.length, selectedTopic, stageId]);

  const currentQuestion = questions[currentQuestionIndex];
  const passed = score >= PASS_SCORE;

  const wheelArcs = useMemo(() => {
    return WHEEL_TOPICS.map((topic, i) => {
      const startA = (i * segmentAngle - 90) * (Math.PI / 180);
      const endA = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
      const x1 = Math.cos(startA);
      const y1 = Math.sin(startA);
      const x2 = Math.cos(endA);
      const y2 = Math.sin(endA);
      const labelA = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
      const lx = 0.62 * Math.cos(labelA);
      const ly = 0.62 * Math.sin(labelA);

      return {
        topic,
        color: WHEEL_COLORS[i],
        path: `M0,0 L${x1},${y1} A1,1,0,0,1,${x2},${y2} Z`,
        lx,
        ly,
      };
    });
  }, [segmentAngle]);

  return (
    <div className="spin-page">
      {view === 'intro' && (
        <div className="spin-intro-overlay">
          <div className="spin-intro-modal">
            <div className="spin-header-row">
              <img src="/gamification/minigames/wheel.png" alt="Wheel" className="spin-mini-icon" />
            </div>

            <div className="spin-intro-panel">
              <h1>SPIN THE WHEEL</h1>
              <p>Placement Topics • Medium Difficulty</p>
              <ul>
                <li>Spin once to get a random placement topic</li>
                <li>Answer {QUESTION_COUNT} MCQs in {QUIZ_DURATION} seconds</li>
                <li>Pass by scoring at least {PASS_SCORE}</li>
                <li>XP is awarded only on first completion for this stage</li>
                <li>Replay gives 0 XP if already completed</li>
              </ul>
            </div>

            <div className="spin-intro-actions">
              <button
                type="button"
                className="spin-back-link"
                onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button type="button" className="spin-main-btn spin-intro-start" onClick={() => setView('wheel')}>
                START
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'wheel' && (
        <div className="spin-stage">
          <div className="spin-header-row">
            <img src="/gamification/minigames/wheel.png" alt="Wheel" className="spin-mini-icon" />
          </div>

          <div className="spin-wheel-wrap">
            <svg
              className="spin-wheel"
              viewBox="-1.08 -1.08 2.16 2.16"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.2,1)' : 'none',
              }}
            >
              {wheelArcs.map((segment) => (
                <g key={segment.topic}>
                  <path d={segment.path} fill={segment.color} stroke="rgba(255,255,255,0.85)" strokeWidth="0.018" />
                  <text
                    x={segment.lx}
                    y={segment.ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="0.12"
                    fontWeight="700"
                  >
                    {segment.topic.replace('&', '')}
                  </text>
                </g>
              ))}
            </svg>
            <div className="spin-pointer" />
            <div className="spin-hub">?</div>
          </div>

          <button type="button" className="spin-main-btn" onClick={handleSpin} disabled={spinning}>
            {spinning ? 'SPINNING...' : 'SPIN'}
          </button>

          <button
            type="button"
            className="spin-back-link"
            onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}

      {view === 'quiz' && (
        <div className="spin-stage">
          <div className="spin-header-row">
            <img src="/gamification/minigames/wheel.png" alt="Wheel" className="spin-mini-icon" />
          </div>

          <div className="spin-quiz-timer">{mm} : {ss}</div>

          <div className="spin-quiz-card">
            <p className="spin-quiz-question">{currentQuestion?.question || 'Preparing question...'}</p>
            <div className="spin-option-grid">
              {(currentQuestion?.options || []).map((option, i) => {
                let cls = 'spin-option-btn';
                if (selectedAnswer !== null && i === currentQuestion.correctAnswer) cls += ' correct';
                if (selectedAnswer !== null && i === selectedAnswer && i !== currentQuestion.correctAnswer) cls += ' wrong';

                return (
                  <button
                    key={`${currentQuestion?.id || 'q'}-${i}`}
                    className={cls}
                    onClick={() => pickAnswer(i)}
                    disabled={selectedAnswer !== null}
                  >
                    <span>{OPTION_LABELS[i]})</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="spin-footer-row">
            <button type="button" className="spin-back-link" onClick={() => setView('wheel')}>
              <ArrowLeft size={14} /> Back
            </button>
            <div className="spin-inline-stats">
              <span>{selectedTopic}</span>
              <span>Q {currentQuestionIndex + 1}/{questions.length || QUESTION_COUNT}</span>
              <span>{score} pts</span>
            </div>
          </div>

          {error && <p className="spin-inline-note">{error}</p>}
        </div>
      )}

      {view === 'countdown' && (
        <div className="spin-stage spin-countdown-stage">
          <div className="spin-header-row">
            <img src="/gamification/minigames/wheel.png" alt="Wheel" className="spin-mini-icon" />
          </div>

          <div className="spin-countdown-card">
            <p className="spin-countdown-topic">Topic: {selectedTopic}</p>
            <div className="spin-countdown-number">{countdown}</div>
            <p className="spin-countdown-sub">Get ready! Quiz starts now...</p>
          </div>
        </div>
      )}

      {view === 'result' && (
        <div className="spin-stage">
          <div className="spin-header-row">
            <img src="/gamification/minigames/wheel.png" alt="Wheel" className="spin-mini-icon" />
          </div>

          <div className="spin-trophy"><Trophy size={72} /></div>

          <div className="spin-result-card">
            <div className="spin-result-main">
              <h2>{passed ? 'YOUR SCORE!' : 'TIME-OUT!'}</h2>
              <p>{xpEarned} XP gained</p>
            </div>
            <div className="spin-result-score">{score}</div>
          </div>

          <button type="button" className="spin-spin-again" onClick={() => setView('wheel')}>
            SPIN AGAIN
          </button>

          <button
            type="button"
            className="spin-back-link"
            onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
