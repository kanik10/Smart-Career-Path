import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Swords, Trophy } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import './BossBattleGame.css';

const PLAYER_MAX_HP = 100;
const PLAYER_DAMAGE = 15;
const BOSS_DAMAGE = 20;
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_PLACEHOLDER_REGEX = /^option\s*[a-f0-9]*$/i;

const BOSS_DIFFICULTY = {
  easy: { label: 'Easy', hp: 100, questionTarget: 8, accent: '#40a4ff' },
  medium: { label: 'Medium', hp: 150, questionTarget: 10, accent: '#f5a524' },
  hard: { label: 'Hard', hp: 200, questionTarget: 12, accent: '#ff5f56' },
};

const WEEKLY_BOSS_CONFIG = {
  placements: {
    1: [
      { id: 'apt-easy', name: 'The Algorithm Thrion', topic: 'Aptitude Fundamentals', difficulty: 'easy' },
      { id: 'apt-logic-medium', name: 'The Logic Hydra', topic: 'Logical Aptitude', difficulty: 'medium' },
      { id: 'apt-hard', name: 'The Quant Warden', topic: 'Advanced Aptitude and Data Interpretation', difficulty: 'hard' },
    ],
    2: [
      { id: 'dsa-easy', name: 'Array Sentinel', topic: 'Arrays and Strings', difficulty: 'easy' },
      { id: 'dsa-medium', name: 'Pattern Drake', topic: 'DSA Problem Patterns', difficulty: 'medium' },
      { id: 'dsa-hard', name: 'Complexity Titan', topic: 'Advanced DSA and Optimization', difficulty: 'hard' },
    ],
    3: [
      { id: 'core-easy', name: 'Core Scout', topic: 'OS DBMS CN Basics', difficulty: 'easy' },
      { id: 'core-medium', name: 'System Golem', topic: 'Core CS Applied Scenarios', difficulty: 'medium' },
      { id: 'core-hard', name: 'Architecture Leviathan', topic: 'Advanced Core CS Problem Solving', difficulty: 'hard' },
    ],
    4: [
      { id: 'int-easy', name: 'HR Sentry', topic: 'Interview Foundations', difficulty: 'easy' },
      { id: 'int-medium', name: 'Round Commander', topic: 'Behavioral and Technical Interview Logic', difficulty: 'medium' },
      { id: 'int-hard', name: 'Offer Tyrant', topic: 'High-pressure Interview Strategy', difficulty: 'hard' },
    ],
  },
  higher_studies: {
    1: [
      { id: 'exam-easy', name: 'Exam Sentinel', topic: 'Exam Basics and Aptitude', difficulty: 'easy' },
      { id: 'exam-medium', name: 'Reasoning Colossus', topic: 'Logical and Verbal Reasoning', difficulty: 'medium' },
      { id: 'exam-hard', name: 'Quant Leviathan', topic: 'Advanced Quant and Analytical Reasoning', difficulty: 'hard' },
    ],
    2: [
      { id: 'verbal-easy', name: 'Verbal Scout', topic: 'Reading and Vocabulary Basics', difficulty: 'easy' },
      { id: 'verbal-medium', name: 'Inference Drake', topic: 'Critical Reading and Logic', difficulty: 'medium' },
      { id: 'verbal-hard', name: 'Argument Titan', topic: 'Advanced Verbal Reasoning', difficulty: 'hard' },
    ],
    3: [
      { id: 'research-easy', name: 'Method Sentry', topic: 'Research Method Basics', difficulty: 'easy' },
      { id: 'research-medium', name: 'Analysis Golem', topic: 'Experimental Design and Analysis', difficulty: 'medium' },
      { id: 'research-hard', name: 'Publication Tyrant', topic: 'Advanced Research Evaluation', difficulty: 'hard' },
    ],
    4: [
      { id: 'app-easy', name: 'SOP Guardian', topic: 'Application Writing Basics', difficulty: 'easy' },
      { id: 'app-medium', name: 'Profile Architect', topic: 'University Fit and Narrative Logic', difficulty: 'medium' },
      { id: 'app-hard', name: 'Admission Overlord', topic: 'Advanced Admission Strategy', difficulty: 'hard' },
    ],
  },
  entrepreneurship: {
    1: [
      { id: 'idea-easy', name: 'Idea Keeper', topic: 'Problem Validation Basics', difficulty: 'easy' },
      { id: 'idea-medium', name: 'Market Hydra', topic: 'Market and Customer Logic', difficulty: 'medium' },
      { id: 'idea-hard', name: 'Opportunity Tyrant', topic: 'Advanced Opportunity Assessment', difficulty: 'hard' },
    ],
    2: [
      { id: 'product-easy', name: 'MVP Scout', topic: 'MVP Fundamentals', difficulty: 'easy' },
      { id: 'product-medium', name: 'Product Drake', topic: 'Feature Prioritization and Tradeoffs', difficulty: 'medium' },
      { id: 'product-hard', name: 'Scale Titan', topic: 'Advanced Product Strategy', difficulty: 'hard' },
    ],
    3: [
      { id: 'finance-easy', name: 'Finance Sentry', topic: 'Unit Economics Basics', difficulty: 'easy' },
      { id: 'finance-medium', name: 'Growth Golem', topic: 'Growth Metrics and Optimization', difficulty: 'medium' },
      { id: 'finance-hard', name: 'Capital Leviathan', topic: 'Advanced Finance and Growth Decisions', difficulty: 'hard' },
    ],
    4: [
      { id: 'pitch-easy', name: 'Pitch Guard', topic: 'Pitch Deck Basics', difficulty: 'easy' },
      { id: 'pitch-medium', name: 'Narrative Hydra', topic: 'Persuasive Pitch Logic', difficulty: 'medium' },
      { id: 'pitch-hard', name: 'Fundraise Warden', topic: 'High-stakes Fundraising Strategy', difficulty: 'hard' },
    ],
  },
};

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

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
    options = [
      `Core principle of ${topic}`,
      `Common use case of ${topic}`,
      `Typical pitfall in ${topic}`,
      `Alternative concept unrelated to ${topic}`,
    ];
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

const fallbackQuestionBank = (topic) => [
  {
    question: `Which statement best describes a key idea in ${topic}?`,
    options: ['Understand the core rule and one practical example', 'Memorize terms without context', 'Skip fundamentals and jump to edge cases', 'Avoid solving practice questions'],
    correctAnswer: 0,
  },
  {
    question: `What is the best way to improve in ${topic} for interviews?`,
    options: ['Practice timed questions and review mistakes', 'Only read solutions', 'Ignore weak areas', 'Study without revision'],
    correctAnswer: 0,
  },
  {
    question: `In ${topic}, what do evaluators value most?`,
    options: ['Correct reasoning and clear explanation', 'Fast guessing', 'Long answers without logic', 'Memorized scripts only'],
    correctAnswer: 0,
  },
  {
    question: `After a wrong answer in ${topic}, what should you do first?`,
    options: ['Analyze why it was wrong and retry', 'Move on immediately', 'Ignore the topic', 'Memorize random facts'],
    correctAnswer: 0,
  },
];

const getDifficultyPhase = (rawData, difficulty) => {
  if (!rawData) return [];

  if (Array.isArray(rawData)) {
    return rawData;
  }

  const phases = Array.isArray(rawData?.phases) ? rawData.phases : [];
  const byName = phases.find((phase) =>
    String(phase?.name || '').toLowerCase().startsWith(difficulty.toLowerCase())
  );

  if (byName && Array.isArray(byName.questions)) {
    return byName.questions;
  }

  const indexMap = { easy: 0, medium: 1, hard: 2 };
  const byIndex = phases[indexMap[difficulty]];
  if (byIndex && Array.isArray(byIndex.questions)) {
    return byIndex.questions;
  }

  return [];
};

export default function BossBattleGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { domain = 'placements', stageId = 1 } = location.state || {};

  const bosses = useMemo(() => {
    const byDomain = WEEKLY_BOSS_CONFIG[domain] || WEEKLY_BOSS_CONFIG.placements;
    return byDomain[stageId] || byDomain[1] || WEEKLY_BOSS_CONFIG.placements[1];
  }, [domain, stageId]);
  const [view, setView] = useState('selector'); // selector, instructions, loading, battle, results
  const [selectedBossIndex, setSelectedBossIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [resultFlag, setResultFlag] = useState(null);
  const [damageText, setDamageText] = useState('');
  const [playerHP, setPlayerHP] = useState(PLAYER_MAX_HP);
  const [bossHP, setBossHP] = useState(BOSS_DIFFICULTY.easy.hp);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [error, setError] = useState('');

  const submittedRef = useRef(false);

  const selectedBoss = bosses[selectedBossIndex] || bosses[0];
  const difficultyMeta = BOSS_DIFFICULTY[selectedBoss?.difficulty] || BOSS_DIFFICULTY.easy;

  const resetCombatState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setResultFlag(null);
    setDamageText('');
    setPlayerHP(PLAYER_MAX_HP);
    setBossHP(difficultyMeta.hp);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setXpEarned(0);
    setIsVictory(false);
    setError('');
    submittedRef.current = false;
  }, [difficultyMeta.hp]);

  const openBossInstructions = (index) => {
    setSelectedBossIndex(index);
    setView('instructions');
    setError('');
  };

  const prepareBattleQuestions = useCallback(async () => {
    if (!selectedBoss) return;

    try {
      setView('loading');
      setError('');

      const rawData = await gamificationService.getBossBattleData(domain, selectedBoss.topic);
      const phaseQuestions = getDifficultyPhase(rawData, selectedBoss.difficulty);

      const normalized = Array.isArray(phaseQuestions)
        ? phaseQuestions
          .map((q, idx) => normalizeQuestion(q, idx, selectedBoss.topic))
          .filter(Boolean)
        : [];

      const deduped = dedupeQuestions(normalized);
      const fallback = fallbackQuestionBank(selectedBoss.topic).map((q, idx) => ({
        id: `fallback-${selectedBoss.id}-${idx + 1}`,
        ...q,
      }));

      const merged = dedupeQuestions([...deduped, ...fallback]);
      const targetCount = difficultyMeta.questionTarget;

      const finalQuestions = [];
      for (let i = 0; i < targetCount; i += 1) {
        finalQuestions.push(merged[i % merged.length]);
      }

      setQuestions(shuffle(finalQuestions).map((q) => randomizeQuestionOptions(q)));
      resetCombatState();
      setView('battle');
    } catch (err) {
      console.error('Error preparing boss battle:', err);
      const targetCount = difficultyMeta.questionTarget;
      const fallback = fallbackQuestionBank(selectedBoss.topic);
      const finalQuestions = [];
      for (let i = 0; i < targetCount; i += 1) {
        finalQuestions.push(fallback[i % fallback.length]);
      }
      setQuestions(shuffle(finalQuestions).map((q, idx) => randomizeQuestionOptions({ ...q, id: `offline-${idx + 1}` })));
      setError('Live boss questions were unavailable, so fallback questions were loaded.');
      resetCombatState();
      setView('battle');
    }
  }, [domain, selectedBoss, difficultyMeta.questionTarget, resetCombatState]);

  const endBattle = useCallback(async (didWin, score, answeredCount) => {
    setIsVictory(didWin);

    let awardedXp = 0;
    if (didWin && !submittedRef.current) {
      submittedRef.current = true;
      try {
        const response = await gamificationService.completeGame({
          domain,
          stageId,
          gameType: 'boss_battle',
          topicName: selectedBoss?.topic || 'Boss Battle',
          score,
          totalQuestions: answeredCount,
        });
        awardedXp = response?.xpEarned || 0;
      } catch (err) {
        console.error('Error submitting boss result:', err);
      }
    }

    setXpEarned(awardedXp);
    setView('results');
  }, [domain, stageId, selectedBoss]);

  const selectAnswer = (optionIndex) => {
    if (selectedAnswer !== null || view !== 'battle') return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    const nextAnswered = totalAnswered + 1;
    const nextCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;

    setSelectedAnswer(optionIndex);
    setTotalAnswered(nextAnswered);

    if (isCorrect) {
      const nextBossHP = Math.max(0, bossHP - BOSS_DAMAGE);
      setCorrectAnswers(nextCorrect);
      setBossHP(nextBossHP);
      setResultFlag('correct');
      setDamageText(`-${BOSS_DAMAGE} Boss HP`);

      if (nextBossHP <= 0) {
        setTimeout(() => {
          endBattle(true, nextCorrect, nextAnswered);
        }, 900);
        return;
      }
    } else {
      const nextPlayerHP = Math.max(0, playerHP - PLAYER_DAMAGE);
      setPlayerHP(nextPlayerHP);
      setResultFlag('wrong');
      setDamageText(`-${PLAYER_DAMAGE} Your HP`);

      if (nextPlayerHP <= 0) {
        setTimeout(() => {
          endBattle(false, nextCorrect, nextAnswered);
        }, 900);
        return;
      }
    }

    setTimeout(() => {
      const nextQuestion = (currentQuestionIndex + 1) % questions.length;
      setCurrentQuestionIndex(nextQuestion);
      setSelectedAnswer(null);
      setResultFlag(null);
      setDamageText('');
    }, 850);
  };

  const handlePlayAgainSameBoss = () => {
    resetCombatState();
    setView('instructions');
  };

  const handleChangeBoss = () => {
    resetCombatState();
    setView('selector');
  };

  const bossHpPercent = Math.max(0, Math.round((bossHP / difficultyMeta.hp) * 100));
  const playerHpPercent = Math.max(0, Math.round((playerHP / PLAYER_MAX_HP) * 100));
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="bb-page">
      {view === 'selector' && (
        <div className="bb-selector-wrap">
          <div className="bb-head-row">
            <button
              type="button"
              className="bb-back-btn"
              onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1>Week 1 Boss Battle</h1>
            <p>Choose a boss to begin the gauntlet. Easy, Medium, and Hard are all available.</p>
          </div>

          <div className="bb-boss-grid">
            {bosses.map((boss, index) => {
              const meta = BOSS_DIFFICULTY[boss.difficulty] || BOSS_DIFFICULTY.easy;
              return (
                <button
                  key={boss.id}
                  type="button"
                  className="bb-boss-card"
                  onClick={() => openBossInstructions(index)}
                >
                  <div className="bb-card-top">
                    <img src="/gamification/minigames/boss.png" alt={boss.name} className="bb-boss-thumb" />
                    <div className="bb-card-meta">
                      <span className="bb-card-name">{boss.name}</span>
                      <span className="bb-card-topic">Topic: {boss.topic}</span>
                    </div>
                  </div>

                  <div className="bb-card-bottom">
                    <span className={`bb-difficulty ${boss.difficulty}`}>{meta.label}</span>
                    <span>{meta.hp} HP</span>
                  </div>

                  <div className="bb-card-progress">
                    <div className="bb-card-progress-fill" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view === 'instructions' && (
        <div className="bb-instruction-modal">
          <div className="bb-instruction-card">
            <div className="bb-instruction-header">
              <img src="/gamification/minigames/boss.png" alt={selectedBoss?.name} className="bb-mini-boss" />
              <div>
                <h2>{selectedBoss?.name}</h2>
                <p>{selectedBoss?.topic} • {difficultyMeta.label} Difficulty</p>
              </div>
            </div>

            <ul>
              <li>Correct answer deals {BOSS_DAMAGE} damage to the boss.</li>
              <li>Wrong answer deals {PLAYER_DAMAGE} damage to you.</li>
              <li>Your HP resets to {PLAYER_MAX_HP} for this battle.</li>
              <li>XP follows the same replay logic: first clear can award XP, replay can return 0 XP.</li>
              <li>Win condition: reduce boss HP to 0 before your HP reaches 0.</li>
            </ul>

            <div className="bb-instruction-actions">
              <button type="button" className="bb-ghost-btn" onClick={handleChangeBoss}>Boss Selector</button>
              <button type="button" className="bb-main-btn" onClick={prepareBattleQuestions}>
                <Swords size={16} /> Begin Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'loading' && (
        <div className="bb-loading-card">
          <div className="bb-spinner" />
          <p>Summoning {selectedBoss?.name}...</p>
        </div>
      )}

      {view === 'battle' && currentQuestion && (
        <div className="bb-battle-wrap bb-pokemon-layout">
          <div className="bb-top-actions">
            <button type="button" className="bb-back-btn" onClick={handleChangeBoss}>
              <ArrowLeft size={16} /> Flee
            </button>
            <span className="bb-difficulty-tag" style={{ borderColor: difficultyMeta.accent, color: difficultyMeta.accent }}>
              {difficultyMeta.label}
            </span>
          </div>

          <div className="bb-pokemon-frame">
            <div className="bb-battle-field bb-pokemon-field">
              <img src="/gamification/minigames/pokemonbg.png" alt="Battle background" className="bb-pokemon-bg" />

              {/* Vector question bubble */}
              <div className="bb-cloud-wrap">
                <div className="bb-cloud-image" aria-hidden="true" />
                <p className="bb-cloud-question">{currentQuestion.question}</p>
              </div>

              {/* Player sprite — bottom left */}
              <div className="bb-player-wrap">
                <img src="/gamification/minigames/pokemonuser.png" alt="Player" className="bb-user-art" />
              </div>

              {/* Boss hexagon with name inside — bottom right */}
              <div className="bb-boss-wrap">
                <svg
                  className="bb-boss-hex-svg"
                  viewBox="0 0 200 220"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id={`hexGrad-${selectedBoss?.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={difficultyMeta.accent} stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#1a3a7a" />
                    </linearGradient>
                  </defs>
                  {/* Shadow */}
                  <polygon
                    points="100,8 188,58 188,158 100,208 12,158 12,58"
                    fill="#1a2660"
                    opacity="0.35"
                    transform="translate(4,6)"
                  />
                  {/* Main hex */}
                  <polygon
                    points="100,8 188,58 188,158 100,208 12,158 12,58"
                    fill={`url(#hexGrad-${selectedBoss?.id})`}
                    stroke="#0d1a4a"
                    strokeWidth="3"
                  />
                  {/* Inner shine ring */}
                  <polygon
                    points="100,24 174,68 174,148 100,192 26,148 26,68"
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="2"
                  />
                  {/* Top glare */}
                  <ellipse
                    cx="82" cy="54" rx="28" ry="14"
                    fill="rgba(255,255,255,0.22)"
                    transform="rotate(-15,82,54)"
                  />
                  {/* Boss name — split across two lines if long */}
                  {(() => {
                    const name = selectedBoss?.name || '';
                    const words = name.split(' ');
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(' ');
                    const line2 = words.slice(mid).join(' ');
                    return line2 ? (
                      <>
                        <text x="100" y="96" textAnchor="middle" dominantBaseline="middle"
                          fontSize="14" fontWeight="800" fill="white"
                          fontFamily="'Segoe UI',Tahoma,sans-serif">
                          {line1}
                        </text>
                        <text x="100" y="116" textAnchor="middle" dominantBaseline="middle"
                          fontSize="14" fontWeight="800" fill="white"
                          fontFamily="'Segoe UI',Tahoma,sans-serif">
                          {line2}
                        </text>
                      </>
                    ) : (
                      <text x="100" y="108" textAnchor="middle" dominantBaseline="middle"
                        fontSize="14" fontWeight="800" fill="white"
                        fontFamily="'Segoe UI',Tahoma,sans-serif">
                        {line1}
                      </text>
                    );
                  })()}
                  {/* Difficulty badge inside hex */}
                  <rect x="60" y="162" width="80" height="22" rx="11"
                    fill={
                      selectedBoss?.difficulty === 'hard' ? '#8a2520'
                      : selectedBoss?.difficulty === 'medium' ? '#8f5a15'
                      : '#234c8d'
                    }
                  />
                  <text x="100" y="173" textAnchor="middle" dominantBaseline="middle"
                    fontSize="11" fontWeight="700" fill="white"
                    fontFamily="'Segoe UI',Tahoma,sans-serif"
                    letterSpacing="0.08em">
                    {difficultyMeta.label.toUpperCase()}
                  </text>
                </svg>
              </div>

              {/* Damage text overlay */}
              <div className={`bb-damage-text ${damageText ? 'show' : ''} ${resultFlag || ''}`}>
                {damageText}
              </div>
            </div>

            <div className="bb-hp-strip">
              <div className="bb-hp-block">
                <span>{selectedBoss?.name}</span>
                <div className="bb-hp-track">
                  <div className="bb-hp-fill boss" style={{ width: `${bossHpPercent}%` }} />
                </div>
                <small>{bossHP} / {difficultyMeta.hp}</small>
              </div>

              <div className="bb-hp-block">
                <span>Player</span>
                <div className="bb-hp-track">
                  <div className="bb-hp-fill player" style={{ width: `${playerHpPercent}%` }} />
                </div>
                <small>{playerHP} / {PLAYER_MAX_HP}</small>
              </div>
            </div>

            <div className="bb-question-panel bb-option-panel">
              <div className="bb-question-meta">
                <span>{selectedBoss?.topic}</span>
                <span>Q {currentQuestionIndex + 1}/{questions.length}</span>
                <span>{progress}%</span>
              </div>

            <div className="bb-options-grid">
              {currentQuestion.options.map((option, index) => {
                let className = 'bb-option-btn';
                if (selectedAnswer !== null && index === selectedAnswer) {
                  className += index === currentQuestion.correctAnswer ? ' correct' : ' wrong';
                }
                if (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer && index === currentQuestion.correctAnswer) {
                  className += ' reveal';
                }

                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    className={className}
                    onClick={() => selectAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <span>{OPTION_LABELS[index]}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="bb-inline-note">{error}</p> : null}
        </div>
        </div>
      )}

      {view === 'results' && (
        <div className="bb-result-card">
          <div className="bb-result-icon">{isVictory ? <Trophy size={44} /> : <ShieldAlert size={44} />}</div>
          <h2>{isVictory ? 'Boss Defeated' : 'Battle Lost'}</h2>
          <p>{selectedBoss?.name}</p>

          <div className="bb-result-stats">
            <div>
              <span>Correct</span>
              <strong>{correctAnswers}/{totalAnswered}</strong>
            </div>
            <div>
              <span>XP Earned</span>
              <strong>{xpEarned}</strong>
            </div>
          </div>

          <div className="bb-result-actions">
            <button type="button" className="bb-main-btn" onClick={handlePlayAgainSameBoss}>Play Again</button>
            <button type="button" className="bb-ghost-btn" onClick={handleChangeBoss}>Choose Boss</button>
            <button
              type="button"
              className="bb-ghost-btn"
              onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
            >
              Back to Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
