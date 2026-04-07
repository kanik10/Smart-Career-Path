import mongoose from 'mongoose';

// === GAMIFICATION PROFILE ===
// Stores XP, level, streaks unified across all domains
const gamificationProfileSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalXp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakDays: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  badges: [
    {
      name: String,
      unlockedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// === STAGE PROGRESS ===
// Tracks progress for each stage (1-4) in a domain
// domain: "placements" | "higher_studies" | "entrepreneurship"
const stageProgressSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    enum: ['placements', 'higher_studies', 'entrepreneurship'],
    required: true,
  },
  stageId: { type: Number, required: true, min: 1, max: 4 },
  completedGames: { type: Number, default: 0, min: 0, max: 4 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

stageProgressSchema.index({ userId: 1, domain: 1, stageId: 1 }, { unique: true });

// === XP LOG ===
// Records every XP transaction for analytics
const xpLogSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  source: {
    type: String,
    enum: ['sprint', 'spin', 'flashcards', 'boss_battle'],
    required: true,
  },
  domain: {
    type: String,
    enum: ['placements', 'higher_studies', 'entrepreneurship'],
    required: true,
  },
  stageId: { type: Number, required: true },
  topicName: String,
  xpAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

xpLogSchema.index({ userId: 1, createdAt: -1 });
xpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// === SPIN REWARD ===
// Records spin wheel rewards earned
const spinRewardSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    enum: ['placements', 'higher_studies', 'entrepreneurship'],
    required: true,
  },
  rewardType: {
    type: String,
    enum: ['xp_boost', 'streak_protection', 'extra_life', 'unlock_all'],
    required: true,
  },
  rewardValue: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

spinRewardSchema.index({ userId: 1, domain: 1 });

// === QUESTION CACHE ===
// Stores generated question sets with 24h TTL
const questionCacheSchema = mongoose.Schema({
  domain: {
    type: String,
    enum: ['placements', 'higher_studies', 'entrepreneurship'],
    required: true,
  },
  topic: { type: String, required: true },
  gameType: {
    type: String,
    enum: ['sprint', 'spin', 'flashcards', 'boss_battle'],
    required: true,
  },
  questions: mongoose.Schema.Types.Mixed, // Flexible structure per game type
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24 hours TTL
  },
});

questionCacheSchema.index({ domain: 1, topic: 1, gameType: 1 }, { unique: true });

// === PERFORMANCE LOG ===
// Tracks performance metrics for analytics
const performanceLogSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    enum: ['placements', 'higher_studies', 'entrepreneurship'],
    required: true,
  },
  gameType: {
    type: String,
    enum: ['sprint', 'spin', 'flashcards', 'boss_battle'],
    required: true,
  },
  topic: String,
  stageId: Number,
  score: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // seconds
  passed: { type: Boolean, default: false },
  xpAwarded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

performanceLogSchema.index({ userId: 1, domain: 1, gameType: 1 });
performanceLogSchema.index({ userId: 1, createdAt: -1 });

export const GamificationProfile = mongoose.model('GamificationProfile', gamificationProfileSchema);
export const StageProgress = mongoose.model('StageProgress', stageProgressSchema);
export const XPLog = mongoose.model('XPLog', xpLogSchema);
export const SpinReward = mongoose.model('SpinReward', spinRewardSchema);
export const QuestionCache = mongoose.model('QuestionCache', questionCacheSchema);
export const PerformanceLog = mongoose.model('PerformanceLog', performanceLogSchema);
