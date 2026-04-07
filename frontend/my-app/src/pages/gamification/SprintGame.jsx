import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CirclePlay, Clock3, RotateCcw, Trophy } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import { GAME_XP_REWARDS, XP_PERFECT_BONUS } from './gamificationConfig';
import './SprintGame.css';

const TIMER_DURATION = 30;
const TARGET_QUESTION_COUNT = 5;
const SCORE_PER_CORRECT = 5;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_PLACEHOLDER_REGEX = /^option\s*\d*$/i;

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

const toOptionText = (option) => {
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'number') return String(option);
  if (option && typeof option === 'object') {
    return String(option.text || option.option || option.value || option.label || '').trim();
  }
  return '';
};

const toCorrectIndex = (rawCorrect, options) => {
  if (typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect < options.length) {
    return rawCorrect;
  }

  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    if (!trimmed) return 0;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber < options.length) {
      return asNumber;
    }

    const letterIndex = OPTION_LABELS.indexOf(trimmed.toUpperCase());
    if (letterIndex !== -1 && letterIndex < options.length) {
      return letterIndex;
    }

    const byText = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (byText !== -1) {
      return byText;
    }
  }

  return 0;
};

const normalizeQuestion = (question, idx) => {
  const questionText = String(
    question?.question || question?.prompt || question?.text || question?.title || ''
  ).trim();

  if (!questionText) return null;

  const rawOptions = question?.options || question?.choices || question?.answers || question?.optionList || [];

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

  const hasOnlyPlaceholders = options.every((opt) => OPTION_PLACEHOLDER_REGEX.test(opt));
  if (hasOnlyPlaceholders) {
    options = [
      'Understand the fundamentals and core definitions',
      'Apply the concept in a practical scenario',
      'Review common mistakes and edge cases',
      'Memorize terms without understanding context',
    ].slice(0, options.length);
  }

  if (options.length < 4) {
    const fillerOptions = [
      'Apply the concept to a real-world example',
      'Review the key principle and rationale',
      'Pick the most precise technical statement',
      'Choose the option based on common practice',
    ];

    while (options.length < 4) {
      options.push(fillerOptions[options.length]);
    }
  }

  const correctSource =
    question?.correctAnswer ?? question?.answer ?? question?.correct_option ?? question?.correctOption;
  const correctAnswer = toCorrectIndex(correctSource, options);

  return {
    id: question?.id || question?._id || idx + 1,
    question: questionText,
    options,
    correctAnswer,
  };
};

const randomizeQuestionOptions = (question) => {
  const pool = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.correctAnswer,
  }));

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

const buildFallbackQuestions = (topic, count, domain) => {
  const safeTopic = topic || 'Core Concepts';
  const placementTemplates = [
    {
      question: `For placement prep in ${safeTopic}, what should a beginner do first?`,
      options: ['Revise basics and solve easy problems daily', 'Start only with the hardest problems', 'Avoid aptitude practice', 'Skip mock interviews'],
      correctAnswer: 0,
    },
    {
      question: 'In campus placements, what does HR usually check first?',
      options: ['Communication and clarity', 'Complex system design only', 'Open-source stars only', 'Advanced research publications'],
      correctAnswer: 0,
    },
    {
      question: 'What is the best way to improve aptitude speed for placements?',
      options: ['Timed practice with shortcuts and review', 'Memorize random formulas only', 'Practice once a week', 'Ignore wrong answers'],
      correctAnswer: 0,
    },
    {
      question: 'For coding rounds, what is a good beginner strategy?',
      options: ['Start with arrays, strings, and basic logic', 'Jump directly to advanced graphs only', 'Avoid dry runs', 'Never analyze time complexity'],
      correctAnswer: 0,
    },
    {
      question: 'What should be included in a fresher resume for placements?',
      options: ['Relevant projects, skills, and measurable impact', 'Unrelated personal details only', 'No projects section', 'Copied generic summaries'],
      correctAnswer: 0,
    },
  ];

  const genericTemplates = [
    {
      question: `Which approach is best to start learning ${safeTopic}?`,
      options: ['Build one small project first', 'Only memorize definitions', 'Avoid practice problems', 'Skip revision entirely'],
      correctAnswer: 0,
    },
    {
      question: `In ${safeTopic}, what helps improve retention the most?`,
      options: ['Daily active recall', 'Reading once and stopping', 'Ignoring mistakes', 'Learning without notes'],
      correctAnswer: 0,
    },
    {
      question: `What is the most useful exam strategy for ${safeTopic}?`,
      options: ['Solve timed practice sets', 'Study only one day before', 'Skip weak areas', 'Avoid revision'],
      correctAnswer: 0,
    },
    {
      question: `What should you do after getting a wrong answer in ${safeTopic}?`,
      options: ['Review why it was wrong', 'Ignore and move on', 'Memorize randomly', 'Change topic immediately'],
      correctAnswer: 0,
    },
    {
      question: `Which habit is most effective for long-term progress in ${safeTopic}?`,
      options: ['Consistent daily practice', 'Long breaks without revision', 'Only watching videos', 'Avoiding mock tests'],
      correctAnswer: 0,
    },
  ];

  const templates = domain === 'placements' ? placementTemplates : genericTemplates;

  const picked = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    picked.push({
      id: `fallback-${i + 1}`,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
    });
  }
  return picked;
};

export default function SprintGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { domain = 'placements', stageId = 1, topic = 'DSA' } = location.state || {};

  const [view, setView] = useState('loading'); // loading, intro, playing, results
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [xpEarned, setXpEarned] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultType, setResultType] = useState('completed');

  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const submittedRef = useRef(false);

  const scoreStorageKey = `sprint-high-score:${domain}:${stageId}:${topic}`;
  const passScore = Math.ceil(TARGET_QUESTION_COUNT * 0.6);

  useEffect(() => {
    const stored = Number(localStorage.getItem(scoreStorageKey) || 0);
    if (!Number.isNaN(stored)) {
      setBestScore(stored);
    }
  }, [scoreStorageKey]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        setView('loading');

        const data = await gamificationService.getSprintQuestions(domain, topic);

        const normalized = Array.isArray(data)
          ? data
            .map((q, idx) => normalizeQuestion(q, idx))
            .filter(Boolean)
          : [];

        const uniqueNormalized = dedupeQuestions(normalized);

        const prepared = uniqueNormalized.slice(0, TARGET_QUESTION_COUNT);

        if (prepared.length < TARGET_QUESTION_COUNT) {
          const fallback = buildFallbackQuestions(topic, TARGET_QUESTION_COUNT, domain);
          const merged = dedupeQuestions([...prepared, ...fallback])
            .slice(0, TARGET_QUESTION_COUNT)
            .map((q) => randomizeQuestionOptions(q));
          setQuestions(merged);
          setError('Duplicate or partial live questions were replaced with unique fallback questions.');
        } else {
          setQuestions(prepared.map((q) => randomizeQuestionOptions(q)));
        }

        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        scoreRef.current = 0;
        setTimeLeft(TIMER_DURATION);
        setXpEarned(0);
        submittedRef.current = false;
        setResultType('completed');
        setView('intro');
      } catch (err) {
        console.error('Error fetching sprint questions:', err);
        const fallback = buildFallbackQuestions(topic, TARGET_QUESTION_COUNT, domain)
          .map((q) => randomizeQuestionOptions(q));
        setQuestions(fallback);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        scoreRef.current = 0;
        setTimeLeft(TIMER_DURATION);
        setXpEarned(0);
        submittedRef.current = false;
        setError('Live questions were unavailable, so fallback quiz questions were loaded.');
        setResultType('completed');
        setView('intro');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [domain, topic]);

  useEffect(() => {
    if (view !== 'playing') return;

    if (timeLeft <= 0) {
      finishGame('timeout');
      return;
    }

    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [view, timeLeft]);

  const selectAnswer = (optionIndex) => {
    if (selectedAnswer !== null || view !== 'playing') return;

    setSelectedAnswer(optionIndex);

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && optionIndex === currentQuestion.correctAnswer) {
      scoreRef.current += SCORE_PER_CORRECT;
      setScore(scoreRef.current);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishGame('completed');
      }
    }, 500);
  };

  const finishGame = useCallback(async (reason = 'completed') => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const finalScore = scoreRef.current;
    const totalQuestions = questions.length;
    const maxScore = totalQuestions * SCORE_PER_CORRECT;
    const solvedCount = Math.round(finalScore / SCORE_PER_CORRECT);
    const isPassed = solvedCount >= Math.ceil(totalQuestions * 0.6);
    let xp = 0;
    let localCalculatedXp = 0;

    if (isPassed) {
      localCalculatedXp = GAME_XP_REWARDS.sprint;
      if (finalScore === maxScore) {
        localCalculatedXp += XP_PERFECT_BONUS;
      }
    }

    if (!submittedRef.current && isPassed) {
      submittedRef.current = true;
      try {
        const response = await gamificationService.completeGame({
          domain,
          stageId,
          gameType: 'sprint',
          topicName: topic,
          score: solvedCount,
          totalQuestions,
        });
        xp = response?.xpEarned ?? 0;
      } catch (err) {
        console.error('Error submitting game result:', err);
        xp = localCalculatedXp;
      }
    } else {
      xp = 0;
    }

    setXpEarned(xp);
    setResultType(reason);

    const updatedBestScore = Math.max(bestScore, finalScore);
    if (updatedBestScore > bestScore) {
      localStorage.setItem(scoreStorageKey, String(updatedBestScore));
      setBestScore(updatedBestScore);
    }

    setView('results');
  }, [bestScore, domain, questions.length, scoreStorageKey, stageId, topic]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const maxScore = questions.length * SCORE_PER_CORRECT;
  const solvedCount = Math.round(score / SCORE_PER_CORRECT);
  const currentIsPassed = solvedCount >= passScore;

  const handleReplay = () => {
    setQuestions((prev) => prev.map((q) => randomizeQuestionOptions(q)));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setXpEarned(0);
    scoreRef.current = 0;
    setTimeLeft(TIMER_DURATION);
    setResultType('completed');
    submittedRef.current = false;
    setView('playing');
  };

  const handleStartGame = () => {
    setQuestions((prev) => prev.map((q) => randomizeQuestionOptions(q)));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(TIMER_DURATION);
    setXpEarned(0);
    setResultType('completed');
    submittedRef.current = false;
    setView('playing');
  };

  return (
    <div className="sprint-page">
      {view === 'loading' && (
        <div className="sprint-card sprint-loading-card">
          <img className="sprint-mini-icon" src="/gamification/minigames/sprint.png" alt="Sprint" />
          <p className="sprint-loading-text">Loading quiz for {topic}...</p>
        </div>
      )}

      {view === 'intro' && (
        <div className="sprint-intro-overlay">
          <div className="sprint-intro-modal">
            <div className="sprint-top-row">
              <img className="sprint-mini-icon" src="/gamification/minigames/sprint.png" alt="Sprint" />
              <div className="sprint-high-score">
                <Trophy size={14} />
                <span>HIGH SCORE : {bestScore}</span>
              </div>
            </div>

            <div className="sprint-intro-panel">
              <h1>SPRINT QUIZ</h1>
              <p>{topic}</p>

              <ul>
                <li>{TARGET_QUESTION_COUNT} multiple-choice questions</li>
                <li>{TIMER_DURATION} seconds total time</li>
                <li>{SCORE_PER_CORRECT} points per correct answer</li>
                <li>Pass by answering at least {passScore} correctly</li>
                <li>Earn {GAME_XP_REWARDS.sprint} XP every successful run</li>
              </ul>
            </div>

            <div className="sprint-intro-actions">
              <button
                type="button"
                className="sprint-back-link"
                onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button type="button" className="sprint-play-again" onClick={handleStartGame}>
                <CirclePlay size={14} /> START
              </button>
            </div>

            {error && <p className="sprint-inline-note">{error}</p>}
          </div>
        </div>
      )}

      {view === 'playing' && currentQuestion && (
        <div className="sprint-card">
          <div className="sprint-top-row">
            <img className="sprint-mini-icon" src="/gamification/minigames/sprint.png" alt="Sprint" />
            <div className="sprint-high-score">
              <Trophy size={14} />
              <span>HIGH SCORE : {bestScore}</span>
            </div>
          </div>

          <div className="sprint-timer-row">
            <div className={`sprint-timer ${timeLeft <= 7 ? 'danger' : ''}`}>
              <Clock3 size={18} />
              <span>{timeLeft} : 00</span>
            </div>
          </div>

          <div className="sprint-question-panel">
            <p className="sprint-question-text">{currentQuestion.question}</p>

            <div className="sprint-options-grid">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`sprint-option-btn ${selectedAnswer === index ? 'selected' : ''} ${
                    selectedAnswer !== null && index === currentQuestion.correctAnswer ? 'correct' : ''
                  } ${selectedAnswer !== null && selectedAnswer === index && index !== currentQuestion.correctAnswer ? 'wrong' : ''}`}
                  onClick={() => selectAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span>{OPTION_LABELS[index]})</span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sprint-play-footer">
            <button
              type="button"
              className="sprint-back-link"
              onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <div className="sprint-status-right">
              <span>Q {currentQuestionIndex + 1}/{questions.length}</span>
              <span>{score} pts</span>
            </div>
          </div>

          <div className="sprint-progress">
            <div className="sprint-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {error && <p className="sprint-inline-note">{error}</p>}
        </div>
      )}

      {view === 'results' && (
        <div className="sprint-card">
          <div className="sprint-top-row">
            <img className="sprint-mini-icon" src="/gamification/minigames/sprint.png" alt="Sprint" />
          </div>

          <div className="sprint-results-strip" />

          <div className="sprint-result-panel">
            <div className="sprint-result-left">
              <h2>{resultType === 'timeout' ? 'TIME-OUT!' : 'HIGH SCORE!'}</h2>
              <p>{xpEarned} XP gained</p>
            </div>

            <div className="sprint-result-badge">{score}</div>
          </div>

          <div className="sprint-results-strip" />

          <div className="sprint-results-meta">
            <span>Score: {score}/{maxScore}</span>
            <span>Correct: {Math.round(score / SCORE_PER_CORRECT)}/{questions.length}</span>
            <span>Best: {Math.max(bestScore, score)}</span>
          </div>

          <p className="sprint-results-note">
            {currentIsPassed
              ? `You passed and earned ${xpEarned} XP.`
              : `You need at least ${passScore} correct answers to pass.`}
          </p>

          <div className="sprint-result-actions">
            <button
              type="button"
              className="sprint-play-again"
              onClick={handleReplay}
            >
              <RotateCcw size={14} /> PLAY AGAIN
            </button>

            <button
              type="button"
              className="sprint-back-link"
              onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
