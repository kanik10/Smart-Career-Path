import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import '../pages/Resources.css';
import './CareerChatbot.css';
import { toBackendUrl } from '../utils/backendUrl';

const initialPrompts = {
  placements:
    "Hey! I'm going to ask you a few quick questions to find your ideal tech specialisation. Let's start — what's the most interesting project or thing you've built or coded recently?",
  'higher-studies':
    "Hey! Let's figure out the right postgrad path for you. First question — what kind of problem or field in tech genuinely excites you the most?",
  entrepreneurship:
    "Hey! Let's find your entrepreneurship focus. Tell me — have you ever had a business or product idea that you just couldn't stop thinking about?",
};

const DOMAIN_OPTIONS = {
  placements: ['DSA', 'Aptitude', 'Fullstack', 'ML', 'Frontend', 'Backend', 'DevOps', 'Cybersecurity', 'UX Design', 'Product Management'],
  'higher-studies': ['IELTS', 'GRE', 'GATE', 'MBA', 'MS Computer Science', 'MS Data Science', 'MS Cybersecurity', 'Research & PhD'],
  entrepreneurship: ['Startup Fundamentals', 'Business & Finance', 'Marketing & Growth', 'Product & Design', 'Legal & Operations', 'Fundraising & Pitching'],
};

const KEYWORD_MAP = {
  placements: {
    DSA: ['dsa', 'algorithm', 'problem solving', 'leetcode', 'competitive programming'],
    Aptitude: ['aptitude', 'quant', 'reasoning', 'logical reasoning'],
    Fullstack: ['fullstack', 'full stack', 'mern', 'both frontend', 'frontend and backend', 'end to end'],
    ML: ['ml', 'machine learning', 'ai', 'data science', 'model', 'prediction'],
    Frontend: ['frontend', 'ui', 'ux', 'react', 'css'],
    Backend: ['backend', 'api', 'server', 'database', 'node', 'express'],
    DevOps: ['devops', 'docker', 'kubernetes', 'deployment', 'ci/cd', 'cloud'],
    Cybersecurity: ['cybersecurity', 'security', 'ethical hacking', 'network security'],
    'UX Design': ['ux design', 'wireframe', 'usability', 'prototype'],
    'Product Management': ['product', 'roadmap', 'feature prioritization', 'stakeholder'],
  },
};

const buildClientRecommendation = (conversationMessages, careerPath) => {
  const options = DOMAIN_OPTIONS[careerPath] || DOMAIN_OPTIONS.placements;
  const keywordMap = KEYWORD_MAP[careerPath] || KEYWORD_MAP.placements;

  const userText = (conversationMessages || [])
    .filter((message) => message.role === 'user')
    .map((message) => String(message.content || '').toLowerCase())
    .join(' ');

  const scored = options.map((option) => {
    const keywords = keywordMap[option] || [];
    let score = 0;
    const matched = [];

    keywords.forEach((keyword) => {
      if (userText.includes(keyword.toLowerCase())) {
        score += keyword.includes(' ') ? 3 : 2;
        matched.push(keyword);
      }
    });

    return { option, score, matched };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0] || { option: options[0], score: 0, matched: [] };
  const second = scored[1] || { score: 0 };

  const confidence = Math.max(55, Math.min(95, 60 + best.score * 3 + Math.max(0, best.score - second.score) * 2));
  const reason = best.matched.length
    ? `Your answers strongly matched ${best.matched.slice(0, 3).join(', ')}, which aligns with ${best.option}.`
    : `${best.option} currently looks like your best fit from the conversation.`;

  return {
    subDomain: best.option,
    confidence,
    reason,
  };
};

const shouldOverrideRecommendation = (parsedRecommendation, fallbackRecommendation, careerPath) => {
  if (!parsedRecommendation || !fallbackRecommendation) return false;

  const options = DOMAIN_OPTIONS[careerPath] || DOMAIN_OPTIONS.placements;
  const normalizedSubdomain = String(parsedRecommendation.subDomain || '').trim();
  const confidence = Number(parsedRecommendation.confidence);

  if (!options.includes(normalizedSubdomain)) return true;
  if (!Number.isFinite(confidence) || confidence < 55 || confidence > 95) return true;

  const looksLikeLegacyMlBias = normalizedSubdomain === 'ML' && confidence === 85 && fallbackRecommendation.subDomain !== 'ML';
  if (looksLikeLegacyMlBias) return true;

  return false;
};

function parseRecommendation(reply) {
  if (!reply || typeof reply !== 'string') return null;

  const firstBrace = reply.indexOf('{');
  const lastBrace = reply.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    const parsed = JSON.parse(reply.slice(firstBrace, lastBrace + 1));
    if (parsed && parsed.subDomain) {
      return {
        subDomain: parsed.subDomain,
        confidence: parsed.confidence,
        reason: parsed.reason,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export default function CareerChatbot({ careerPath, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const chatWindowRef = useRef(null);
  const inputRef = useRef(null);

  const initialMessage = useMemo(() => {
    return initialPrompts[careerPath] || initialPrompts.placements;
  }, [careerPath]);

  useEffect(() => {
    setMessages([{ role: 'bot', text: initialMessage }]);
    setInputValue('');
    setIsLoading(false);
    setRecommendation(null);
    setConfirmed(false);

    // Keep the input ready so users can continue typing without clicking.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [initialMessage]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isLoading]);

  const getAuthToken = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return userInfo?.token;
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const token = getAuthToken();
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'You are not logged in. Please log in again.' },
      ]);
      return;
    }

    const nextMessages = [...messages, { role: 'user', text: trimmedInput }];
    setMessages(nextMessages);
    setInputValue('');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    setIsLoading(true);

    try {
      const payloadMessages = nextMessages.map((message) => ({
        role: message.role === 'bot' ? 'assistant' : 'user',
        content: message.text,
      }));

      const { data } = await axios.post(
        toBackendUrl('/api/groq/chat'),
        {
          messages: payloadMessages,
          careerPath,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const reply = data?.reply || '';
      const parsedRecommendation = parseRecommendation(reply);
      const fallbackRecommendation = buildClientRecommendation(payloadMessages, careerPath);

      const finalRecommendation = shouldOverrideRecommendation(parsedRecommendation, fallbackRecommendation, careerPath)
        ? fallbackRecommendation
        : parsedRecommendation;

      if (finalRecommendation?.subDomain) {
        setRecommendation(finalRecommendation);
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: 'Based on our conversation, I think I have a good recommendation for you!',
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: error.response?.data?.message || 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!recommendation || isLoading) return;

    const token = getAuthToken();
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'You are not logged in. Please log in again.' },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        subDomain: recommendation.subDomain,
        subDomainReason: recommendation.reason,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        await axios.put(toBackendUrl('/api/users/subdomain'), payload, config);
      } catch (primaryError) {
        // Fallback for environments still running an older backend route map.
        await axios.put(toBackendUrl('/api/users/profile'), payload, config);
      }

      // Best-effort verification. We do not fail hard here because some deployments
      // can return legacy profile shapes while still persisting correctly.
      try {
        await axios.get(toBackendUrl('/api/users/profile'), config);
      } catch {
        // ignore verification read failure
      }

      const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          ...stored,
          subDomain: recommendation.subDomain,
          subDomainReason: recommendation.reason || null,
        })
      );

      setConfirmed(true);
      if (onComplete) {
        onComplete(recommendation.subDomain, recommendation.reason);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: error.response?.data?.message || error.message || 'Failed to save your recommendation.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskMoreQuestions = () => {
    setRecommendation(null);
    setMessages((prev) => [
      ...prev,
      { role: 'bot', text: 'Sure! Let me ask you a couple more questions.' },
    ]);
  };

  const confidenceText =
    recommendation?.confidence !== undefined && recommendation?.confidence !== null
      ? `${recommendation.confidence}% match`
      : 'Match confidence unavailable';

  return (
    <div className="career-chatbot-container">
      <div className="career-chatbot-header">
        <div>
          <div className="career-chatbot-header-title">Career Domain Advisor</div>
          <div className="career-chatbot-header-subtitle">
            Personalising your resources
          </div>
        </div>
        <div className="career-chatbot-header-dot"></div>
      </div>
      <div className="career-chatbot-window" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'bot' ? 'career-chatbot-bot-message' : 'career-chatbot-user-message'}
          >
            {message.text}
          </div>
        ))}

        {isLoading && (
          <div className="career-chatbot-typing-indicator" aria-label="Bot is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <form className="career-chatbot-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Type your answer..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          Send
        </button>
      </form>

      {recommendation && !confirmed && (
        <div className="career-chatbot-recommendation-card">
          <h3>Your recommended domain</h3>
          <div className="domain-tag chatbot-domain-tag">{recommendation.subDomain}</div>
          <p className="career-chatbot-confidence-text">{confidenceText}</p>
          <p className="career-chatbot-reason-text">{recommendation.reason}</p>

          <div className="career-chatbot-button-row">
            <button type="button" className="btn-start-now" onClick={handleConfirm} disabled={isLoading}>
              Confirm & view my resources
            </button>
            <button
              type="button"
              className="career-chatbot-outline-button"
              onClick={handleAskMoreQuestions}
              disabled={isLoading}
            >
              Ask more questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}