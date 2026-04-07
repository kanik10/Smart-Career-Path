import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/gamification';

// Helper to get auth token from localStorage
const getAuthToken = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      return parsed.token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handler
const handleError = (error) => {
  console.error('Gamification API error:', error);
  throw error;
};

export const gamificationService = {
  // Get user's gamification profile (XP, level, streak, badges)
  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get stage progress for a domain
  getStageProgress: async (domain) => {
    try {
      const response = await apiClient.get('/stage-progress', {
        params: { domain },
      });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Complete a game and award XP
  completeGame: async (payload) => {
    try {
      const response = await apiClient.post('/complete-game', payload);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get leaderboard (top students by XP)
  getLeaderboard: async () => {
    try {
      const response = await apiClient.get('/leaderboard');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Get sprint questions
  getSprintQuestions: async (domain, topic) => {
    try {
      const response = await apiClient.get('/questions', {
        params: {
          domain,
          topic,
          gameType: 'sprint',
        },
      });
      return response.data.questions;
    } catch (error) {
      handleError(error);
    }
  },

  // Get flashcard questions
  getFlashcardQuestions: async (domain, topic) => {
    try {
      const response = await apiClient.get('/questions', {
        params: {
          domain,
          topic,
          gameType: 'flashcards',
        },
      });
      return response.data.questions;
    } catch (error) {
      handleError(error);
    }
  },

  // Get boss battle questions
  getBossBattleData: async (domain, topic) => {
    try {
      const response = await apiClient.get('/questions', {
        params: {
          domain,
          topic,
          gameType: 'boss_battle',
        },
      });
      return response.data.questions;
    } catch (error) {
      handleError(error);
    }
  },

  // Get spin wheel questions for selected topic
  getSpinQuestion: async (domain, topic = 'spin_random') => {
    try {
      const response = await apiClient.get('/questions', {
        params: {
          domain,
          gameType: 'spin',
          topic,
        },
      });
      return response.data.questions;
    } catch (error) {
      handleError(error);
    }
  },

  // Get domain topics for a stage
  getDomainTopics: async (domain, stageId) => {
    try {
      const response = await apiClient.get('/topics', {
        params: { domain, stageId },
      });
      return response.data.topics;
    } catch (error) {
      handleError(error);
    }
  },

  // Get badges
  getBadges: async () => {
    try {
      const response = await apiClient.get('/badges');
      return response.data.badges;
    } catch (error) {
      handleError(error);
    }
  },
};
