// src/pages/Quiz.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import { GraduationCap, Briefcase, Lightbulb } from 'lucide-react';
import axios from 'axios';

const questions = [
  {
    id: 1,
    question: "What motivates you most about your future career?",
    options: [
      { value: "higher-studies-1", text: "Deep knowledge and research opportunities", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-1", text: "A stable job with good growth prospects", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-1", text: "Creating innovative solutions and building businesses", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 2,
    question: "How do you prefer to solve complex problems?",
    options: [
      { value: "higher-studies-2", text: "Through extensive research and theoretical analysis", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-2", text: "Collaborating with a team using proven methodologies", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-2", text: "By finding creative, unconventional solutions", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 3,
    question: "What kind of environment do you see yourself thriving in?",
    options: [
      { value: "higher-studies-3", text: "An academic or research-oriented setting", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-3", text: "A structured corporate environment with clear hierarchies", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-3", text: "A dynamic, fast-paced startup culture", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 4,
    question: "What kind of learning excites you the most?",
    options: [
      { value: "higher-studies-4", text: "Diving deep into theories and fundamental concepts", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-4", text: "Learning practical, in-demand skills for a specific job", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 2 } },
      { value: "entrepreneurship-4", text: "Learning on-the-go to solve immediate, real-world challenges", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 5,
    question: "How do you handle uncertainty and risk?",
    options: [
      { value: "higher-studies-5", text: "I prefer to minimize it by thorough research and planning", weight: { "higher-studies": 3, "placements": 2, "entrepreneurship": 1 } },
      { value: "placements-5", text: "I follow established protocols and best practices to reduce risk", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-5", text: "I embrace it as a necessary part of innovation and opportunity", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 6,
    question: "Which long-term goal appeals to you the most?",
    options: [
      { value: "higher-studies-6", text: "Contributing to scientific or academic knowledge", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-6", text: "Climbing the corporate ladder to a leadership position", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-6", text: "Launching a product or service that impacts a market", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 7,
    question: "How do you prefer to work on a long-term project?",
    options: [
      { value: "higher-studies-7", text: "Following a detailed, well-structured, and methodical path", weight: { "higher-studies": 3, "placements": 2, "entrepreneurship": 1 } },
      { value: "placements-7", text: "Working steadily towards measurable outcomes and milestones", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 2 } },
      { value: "entrepreneurship-7", text: "Taking bold, iterative steps towards a grand vision", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 8,
    question: "What kind of work satisfaction do you seek?",
    options: [
      { value: "higher-studies-8", text: "The joy of solving complex intellectual puzzles", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-8", text: "Recognition and rewards for achieving defined targets", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-8", text: "Seeing the direct, tangible impact of my own work and ideas", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 9,
    question: "Which of these best describes your ideal lifestyle?",
    options: [
      { value: "higher-studies-9", text: "A life of continual learning and intellectual pursuit with flexibility", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-9", text: "A stable work-life balance with financial security", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-9", text: "A high-risk, high-reward journey with maximum independence", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 10,
    question: "How do you define 'success'?",
    options: [
      { value: "higher-studies-10", text: "Becoming a leading expert in a specific subject matter", weight: { "higher-studies": 3, "placements": 2, "entrepreneurship": 1 } },
      { value: "placements-10", text: "Achieving promotions, peer recognition, and financial stability", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-10", text: "Building something valuable and lasting from scratch", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 11,
    question: "How comfortable are you with public speaking and pitching ideas?",
    options: [
      { value: "higher-studies-11", text: "I prefer presenting detailed research to a knowledgeable audience.", weight: { "higher-studies": 3, "placements": 2, "entrepreneurship": 1 } },
      { value: "placements-11", text: "I am comfortable presenting to colleagues and management within a company.", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 2 } },
      { value: "entrepreneurship-11", text: "I thrive on pitching ideas to investors, customers, and the public.", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 12,
    question: "What is your preferred method of learning a new technology?",
    options: [
      { value: "higher-studies-12", text: "Reading the official documentation and academic papers.", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-12", text: "Taking a structured online course with practical exercises.", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 2 } },
      { value: "entrepreneurship-12", text: "Jumping in and building a project with it immediately.", weight: { "higher-studies": 1, "placements": 2, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 13,
    question: "How do you view failure in a professional context?",
    options: [
      { value: "higher-studies-13", text: "As a data point to refine a hypothesis or theory.", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 2 } },
      { value: "placements-13", text: "As a setback to be avoided through careful planning.", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-13", text: "As a necessary and valuable stepping stone to innovation.", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 14,
    question: "What is your primary driver for choosing a task?",
    options: [
      { value: "higher-studies-14", text: "How intellectually challenging and interesting it is.", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-14", text: "How it aligns with my job description and career growth.", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-14", text: "How it moves my personal vision or product forward.", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
  {
    id: 15,
    question: "Looking 10 years ahead, what would be your ideal achievement?",
    options: [
      { value: "higher-studies-15", text: "Being a respected expert in a specialized academic or technical field.", weight: { "higher-studies": 3, "placements": 1, "entrepreneurship": 1 } },
      { value: "placements-15", text: "Holding a senior management position in a reputable company.", weight: { "higher-studies": 1, "placements": 3, "entrepreneurship": 1 } },
      { value: "entrepreneurship-15", text: "Having successfully built and scaled a company I created.", weight: { "higher-studies": 1, "placements": 1, "entrepreneurship": 3 } }
    ]
  },
];

const careerPaths = {
  "higher-studies": { title: "Higher Studies", icon: GraduationCap, description: "Focus on advanced degrees and research." },
  "placements": { title: "Placements", icon: Briefcase, description: "Prepare for corporate careers and jobs." },
  "entrepreneurship": { title: "Entrepreneurship", icon: Lightbulb, description: "Build your own venture and innovate." }
};

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [recommendedPath, setRecommendedPath] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (!selectedAnswer) {
      alert('Please select an answer to continue.');
      return;
    }
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const scores = { "higher-studies": 0, "placements": 0, "entrepreneurship": 0 };
      newAnswers.forEach((answer, index) => {
        const question = questions[index];
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          Object.entries(option.weight).forEach(([path, weight]) => {
            scores[path] += weight;
          });
        }
      });
      const recommended = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
      setRecommendedPath(recommended);
      setShowResult(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const previousAnswer = answers[currentQuestion - 1] || '';
      setSelectedAnswer(previousAnswer);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSelectPath = async (path) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        alert('You are not logged in. Please log in again.');
        navigate('/login');
        return;
      }
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.put(
        'http://localhost:5000/api/users/career-path',
        { careerPath: path },
        config
      );
      alert(`Career path "${careerPaths[path].title}" selected!`);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save career path.");
    }
  };

  if (showResult) {
    return (
      <div className="auth-container">
        <div className="auth-card quiz-results-card">
          <header className="auth-header">
            <img src={vppcoeLogo} alt="VPPCOE Logo" className="logo" />
            <h1 className="title">Your Recommended Path</h1>
            <p className="description">Based on your answers, we suggest this path.</p>
          </header>
          <main className="auth-content">
            <div className="path-recommendation">
              {Object.entries(careerPaths).map(([key, path]) => {
                const Icon = path.icon;
                const isRecommended = key === recommendedPath;
                return (
                  <div key={key} className={`path-card ${isRecommended ? 'recommended' : ''}`}>
                    <Icon className="path-icon" size={48} />
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="path-selection">
              <h4>Choose Your Path</h4>
              <p>You can follow our recommendation or choose another path.</p>
              <div className="path-buttons">
                {Object.entries(careerPaths).map(([key, path]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectPath(key)}
                    className={key === recommendedPath ? 'btn btn-primary' : 'btn btn-outline'}
                  >
                    {path.title}
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card quiz-card">
        <header className="auth-header">
          <h1 className="title">Career Path Assessment</h1>
          <p className="description">Question {currentQuestion + 1} of {questions.length}</p>
        </header>
        <main className="auth-content">
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="quiz-question-area">
            <h3>{questions[currentQuestion].question}</h3>
            <div className="quiz-options">
              {questions[currentQuestion].options.map((option) => (
                <label key={option.value} className={`quiz-option ${selectedAnswer === option.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`quizOption-${questions[currentQuestion].id}`}
                    value={option.value}
                    checked={selectedAnswer === option.value}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="quiz-navigation">
            <button
              className="btn btn-outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              {currentQuestion === questions.length - 1 ? 'Get Results' : 'Next'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}