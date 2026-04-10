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

  const initialMessage = useMemo(() => {
    return initialPrompts[careerPath] || initialPrompts.placements;
  }, [careerPath]);

  useEffect(() => {
    setMessages([{ role: 'bot', text: initialMessage }]);
    setInputValue('');
    setIsLoading(false);
    setRecommendation(null);
    setConfirmed(false);
  }, [initialMessage]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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

      if (parsedRecommendation?.subDomain) {
        setRecommendation(parsedRecommendation);
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
      await axios.put(
        toBackendUrl('/api/users/subdomain'),
        {
          subDomain: recommendation.subDomain,
          subDomainReason: recommendation.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
          text: error.response?.data?.message || 'Failed to save your recommendation.',
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
