import express from 'express';
import {
  getOrCreateProfile,
  getStageProgress,
  completeGame,
  getQuestions,
  getDomainTopics,
  getLeaderboard,
  recordSpinReward,
  getBadges,
} from '../controllers/gamificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All gamification routes require authentication
router.use(protect);

// Profile endpoints
router.get('/profile', getOrCreateProfile);

// Stage progress
router.get('/stage-progress', getStageProgress);

// Complete a game and award XP
router.post('/complete-game', completeGame);

// Get or generate questions
router.get('/questions', getQuestions);

// Get domain topics for a stage
router.get('/topics', getDomainTopics);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Spin wheel reward
router.post('/spin-reward', recordSpinReward);

// Badges
router.get('/badges', getBadges);

export default router;
