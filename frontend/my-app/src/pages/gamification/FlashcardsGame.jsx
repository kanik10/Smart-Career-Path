import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { gamificationService } from '../../services/gamificationService';
import './FlashcardsGame.css';

const DURATION = 180;
const PAIR_COUNT = 8;

const FALLBACK_PAIRS = [
  { term: 'Stack', definition: 'LIFO data structure' },
  { term: 'Queue', definition: 'FIFO data structure' },
  { term: 'Array', definition: 'Indexed linear collection' },
  { term: 'Linked List', definition: 'Node-based sequential structure' },
  { term: 'Binary Tree', definition: 'Hierarchical nodes with up to 2 children' },
  { term: 'Hash Map', definition: 'Key-value storage using hashing' },
  { term: 'Graph', definition: 'Vertices connected by edges' },
  { term: 'Heap', definition: 'Priority-ordered complete binary tree' },
  { term: 'Time Complexity', definition: 'How runtime grows with input size' },
  { term: 'Space Complexity', definition: 'How memory usage grows with input size' },
];

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizePair = (item) => {
  const term = String(item?.term || item?.question || item?.title || '').trim();
  const definition = String(item?.definition || item?.answer || item?.explanation || '').trim();
  if (!term || !definition) return null;
  return { term, definition };
};

const dedupePairs = (pairs) => {
  const seen = new Set();
  const unique = [];
  pairs.forEach((pair) => {
    const key = `${pair.term.toLowerCase().trim()}|${pair.definition.toLowerCase().trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(pair);
  });
  return unique;
};

const buildDeck = (pairs) => {
  const items = [];
  pairs.forEach((pair, idx) => {
    items.push({ pairId: idx, text: pair.term });
    items.push({ pairId: idx, text: pair.definition });
  });

  return shuffle(items).map((item, i) => ({
    id: i,
    pairId: item.pairId,
    text: item.text,
    flipped: false,
    matched: false,
  }));
};

export default function FlashcardsGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { domain = 'placements', stageId = 1, topic = 'DSA' } = location.state || {};

  const [view, setView] = useState('setup'); // setup, game, result
  const [cards, setCards] = useState([]);
  const [basePairs, setBasePairs] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [won, setWon] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const checkRef = useRef(null);
  const submittedRef = useRef(false);
  const matchRef = useRef(0);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await gamificationService.getFlashcardQuestions(domain, topic);
        const normalized = Array.isArray(data)
          ? data.map(normalizePair).filter(Boolean)
          : [];

        const unique = dedupePairs(normalized);

        if (unique.length >= PAIR_COUNT) {
          setBasePairs(unique.slice(0, PAIR_COUNT));
        } else {
          const fallback = dedupePairs([...unique, ...FALLBACK_PAIRS]).slice(0, PAIR_COUNT);
          setBasePairs(fallback);
          setError('Live flashcards were partial, so unique fallback pairs were added.');
        }
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setBasePairs(FALLBACK_PAIRS.slice(0, PAIR_COUNT));
        setError('Live flashcards failed to load, fallback pairs were used.');
      } finally {
        setLoading(false);
      }
    };

    fetchPairs();
  }, [domain, topic]);

  useEffect(() => {
    if (view !== 'game') return;
    if (timeLeft <= 0) {
      endGame(false, matchRef.current);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, view]);

  const startGame = () => {
    setCards(buildDeck(basePairs));
    setFlippedIds([]);
    setMatchedCount(0);
    matchRef.current = 0;
    setTimeLeft(DURATION);
    setWon(false);
    setLocked(false);
    setXpEarned(0);
    submittedRef.current = false;
    setView('game');
  };

  const flipCard = (id) => {
    if (locked) return;
    const card = cards[id];
    if (!card || card.flipped || card.matched) return;

    const updated = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(updated);

    const nextFlipped = [...flippedIds, id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setLocked(true);
      const [a, b] = nextFlipped;
      const first = updated[a];
      const second = updated[b];

      checkRef.current = setTimeout(() => {
        if (first.pairId === second.pairId) {
          const matchedCards = updated.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
          setCards(matchedCards);

          const nextMatched = matchRef.current + 1;
          matchRef.current = nextMatched;
          setMatchedCount(nextMatched);

          if (nextMatched >= PAIR_COUNT) {
            endGame(true, nextMatched);
            return;
          }
        } else {
          const resetCards = updated.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c));
          setCards(resetCards);
        }

        setFlippedIds([]);
        setLocked(false);
      }, 820);
    }
  };

  const endGame = useCallback(
    async (isWin, finalMatched) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (checkRef.current) clearTimeout(checkRef.current);

      setWon(isWin);

      let awardedXp = 0;
      if (isWin && !submittedRef.current) {
        submittedRef.current = true;
        try {
          const response = await gamificationService.completeGame({
            domain,
            stageId,
            gameType: 'flashcards',
            topicName: topic,
            score: finalMatched,
            totalQuestions: PAIR_COUNT,
          });
          awardedXp = response?.xpEarned || 0;
        } catch (err) {
          console.error('Flashcards completeGame failed:', err);
        }
      }

      setXpEarned(awardedXp);
      setView('result');
    },
    [domain, stageId, topic]
  );

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="fc-page">
      {view === 'setup' && (
        <div className="fc-setup-overlay">
          <div className="fc-setup-modal">
            <div className="fc-top-row">
              <img src="/gamification/minigames/flashcards.png" alt="Flashcards" className="fc-mini-icon" />
            </div>

            <div className="fc-setup-panel">
              <h1>FLASHCARDS</h1>
              <p>{topic}</p>
              <ul>
                <li>Match all {PAIR_COUNT} term-definition pairs</li>
                <li>You have {Math.floor(DURATION / 60)} minutes</li>
                <li>Flip two cards to find a matching pair</li>
                <li>Win by matching all pairs before timeout</li>
                <li>XP is first completion only; replay can give 0 XP</li>
              </ul>
            </div>

            <div className="fc-setup-actions">
              <button
                type="button"
                className="fc-back-link"
                onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button type="button" className="fc-main-btn" onClick={startGame} disabled={loading || basePairs.length < PAIR_COUNT}>
                START
              </button>
            </div>

            {loading && <p className="fc-note">Loading flashcards...</p>}
            {error && <p className="fc-note">{error}</p>}
          </div>
        </div>
      )}

      {view === 'game' && (
        <div className="fc-stage">
          <div className="fc-top-row">
            <img src="/gamification/minigames/flashcards.png" alt="Flashcards" className="fc-mini-icon" />
            <div className="fc-timer">{mm} : {ss}</div>
          </div>

          <div className="fc-grid">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`fc-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                onClick={() => flipCard(card.id)}
                disabled={locked || card.flipped || card.matched}
              >
                {card.flipped || card.matched ? (
                  <span className="fc-card-text">{card.text}</span>
                ) : (
                  <Sparkles size={22} className="fc-star" />
                )}
              </button>
            ))}
          </div>

          <div className="fc-bottom-row">
            <button
              type="button"
              className="fc-back-link"
              onClick={() => endGame(false, matchRef.current)}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="fc-progress">{matchedCount}/{PAIR_COUNT} pairs</span>
          </div>
        </div>
      )}

      {view === 'result' && (
        <div className="fc-stage">
          <div className="fc-top-row">
            <img src="/gamification/minigames/flashcards.png" alt="Flashcards" className="fc-mini-icon" />
          </div>

          <div className="fc-result-panel">
            <h2>{won ? 'VICTORY!' : 'TIMEOUT!'}</h2>
            <p>{xpEarned} XP gained</p>
          </div>

          <button type="button" className="fc-play-again" onClick={startGame}>
            PLAY AGAIN
          </button>

          <button
            type="button"
            className="fc-back-link"
            onClick={() => navigate('/gamification/arena', { state: { domain, careerPath: domain } })}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
