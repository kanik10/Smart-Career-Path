import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import {
  GamificationProfile,
  StageProgress,
  XPLog,
  SpinReward,
  QuestionCache,
  PerformanceLog,
} from '../models/gamificationModel.js';
import {
  generateSprintQuestions,
  generateFlashcards,
  generateBossBattleQuestions,
  generateSpinQuestions,
  generateDomainTopics,
} from '../utils/groqQuestionGenerator.js';

// XP configuration per game type
const XP_REWARDS = {
  sprint: 100,
  spin: 100,
  flashcards: 200,
  boss_battle: 300,
};

// XP required per level
const XP_PER_LEVEL = 1000;
const OPTION_PLACEHOLDER_REGEX = /^option\s*[a-z0-9]*$/i;
const BOSS_PHASE_TARGETS = {
  Easy: 8,
  Medium: 10,
  Hard: 12,
};

const textKey = (value = '') => String(value).toLowerCase().replace(/\s+/g, ' ').trim();

const toOptionText = (option) => {
  if (typeof option === 'string') return option.trim();
  if (typeof option === 'number') return String(option);
  if (option && typeof option === 'object') {
    return String(option.text || option.option || option.value || option.label || '').trim();
  }
  return '';
};

const normalizeCorrectIndex = (rawCorrect, options) => {
  if (typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect < options.length) {
    return rawCorrect;
  }

  if (typeof rawCorrect === 'string') {
    const trimmed = rawCorrect.trim();
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber < options.length) {
      return asNumber;
    }

    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    const letter = letterMap[trimmed.toUpperCase()];
    if (typeof letter === 'number' && letter < options.length) {
      return letter;
    }

    const byText = options.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (byText !== -1) {
      return byText;
    }
  }

  return 0;
};

const fallbackOptionPool = (topic) => [
  `Most accurate ${topic} principle`,
  `Common mistake in ${topic}`,
  `Partially correct ${topic} statement`,
  `Irrelevant distractor about ${topic}`,
];

const sanitizeOptions = (rawOptions, topic) => {
  let options = [];

  if (Array.isArray(rawOptions)) {
    options = rawOptions.map(toOptionText).filter(Boolean);
  } else if (rawOptions && typeof rawOptions === 'object') {
    options = Object.keys(rawOptions)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => toOptionText(rawOptions[key]))
      .filter(Boolean);
  }

  const unique = [];
  const seen = new Set();
  options.forEach((opt) => {
    const key = textKey(opt);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(opt);
  });

  let cleaned = unique;
  if (cleaned.length && cleaned.every((opt) => OPTION_PLACEHOLDER_REGEX.test(opt))) {
    cleaned = [];
  }

  const fillers = fallbackOptionPool(topic);
  let fillerIndex = 0;
  while (cleaned.length < 4) {
    const candidate = fillers[fillerIndex % fillers.length];
    fillerIndex += 1;
    if (!cleaned.some((item) => textKey(item) === textKey(candidate))) {
      cleaned.push(candidate);
    }
  }

  return cleaned.slice(0, 4);
};

const sanitizeMcqList = (rawQuestions, topic, targetCount = 5, difficultyLabel = 'medium') => {
  const items = Array.isArray(rawQuestions) ? rawQuestions : [];
  const unique = [];
  const seenQuestions = new Set();

  items.forEach((raw, idx) => {
    const questionText = String(raw?.question || raw?.prompt || raw?.text || '').trim();
    const key = textKey(questionText);
    if (!key || seenQuestions.has(key)) return;

    const options = sanitizeOptions(raw?.options || raw?.choices || raw?.answers || [], topic);
    if (options.length < 4) return;

    const correctAnswer = normalizeCorrectIndex(
      raw?.correctAnswer ?? raw?.answer ?? raw?.correct_option ?? raw?.correctOption,
      options
    );

    seenQuestions.add(key);
    unique.push({
      id: raw?.id || raw?._id || idx + 1,
      question: questionText,
      options,
      correctAnswer,
    });
  });

  const fallbackQuestions = Array.from({ length: Math.max(targetCount, 4) }).map((_, idx) => ({
    id: `fallback-${difficultyLabel}-${idx + 1}`,
    question: `${difficultyLabel[0].toUpperCase() + difficultyLabel.slice(1)} ${topic} question ${idx + 1}: choose the best answer.`,
    options: sanitizeOptions([], topic),
    correctAnswer: 0,
  }));

  const merged = [...unique];
  for (let i = 0; merged.length < targetCount; i += 1) {
    const candidate = fallbackQuestions[i % fallbackQuestions.length];
    const key = textKey(candidate.question);
    if (!seenQuestions.has(key)) {
      merged.push(candidate);
      seenQuestions.add(key);
    }
  }

  return merged.slice(0, targetCount);
};

const sanitizeFlashcards = (rawCards, topic) => {
  const cards = Array.isArray(rawCards) ? rawCards : [];
  const unique = [];
  const seen = new Set();

  cards.forEach((card, idx) => {
    const term = String(card?.term || card?.question || card?.title || '').trim();
    const definition = String(card?.definition || card?.answer || card?.explanation || '').trim();
    if (!term || !definition) return;
    const key = `${textKey(term)}|${textKey(definition)}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({
      id: card?.id || idx + 1,
      term,
      definition,
    });
  });

  const fallback = Array.from({ length: 8 }).map((_, idx) => ({
    id: `fallback-card-${idx + 1}`,
    term: `${topic} Concept ${idx + 1}`,
    definition: `Core explanation ${idx + 1} for ${topic}.`,
  }));

  const merged = [...unique];
  for (let i = 0; merged.length < 8; i += 1) {
    merged.push(fallback[i % fallback.length]);
  }

  return merged;
};

const sanitizeBossBattleQuestions = (rawBoss, topic) => {
  const phases = Array.isArray(rawBoss?.phases) ? rawBoss.phases : [];

  return {
    phases: ['Easy', 'Medium', 'Hard'].map((phaseName, phaseIndex) => {
      const found = phases.find((p) => textKey(p?.name) === textKey(phaseName)) || phases[phaseIndex] || {};
      const count = BOSS_PHASE_TARGETS[phaseName];
      return {
        name: phaseName,
        questions: sanitizeMcqList(found?.questions, topic, count, phaseName.toLowerCase()),
      };
    }),
  };
};

const sanitizeQuestionsByType = (gameType, questions, topic) => {
  switch (gameType) {
    case 'sprint':
      return sanitizeMcqList(questions, topic, 5, 'easy');
    case 'spin':
      return sanitizeMcqList(questions, topic, 5, 'medium');
    case 'flashcards':
      return sanitizeFlashcards(questions, topic);
    case 'boss_battle':
      return sanitizeBossBattleQuestions(questions, topic);
    default:
      return questions;
  }
};

const toStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const updateDailyStreak = (profile) => {
  const today = toStartOfDay(new Date());

  if (!profile.lastActivityDate) {
    profile.streakDays = 1;
    profile.lastActivityDate = new Date();
    return;
  }

  const lastDay = toStartOfDay(profile.lastActivityDate);
  const dayDiff = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff <= 0) {
    return;
  }

  if (dayDiff === 1) {
    profile.streakDays = (profile.streakDays || 0) + 1;
  } else {
    profile.streakDays = 1;
  }

  profile.lastActivityDate = new Date();
};

// @desc    Initialize or get gamification profile for user
export const getOrCreateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let profile = await GamificationProfile.findOne({ userId });

  if (!profile) {
    profile = await GamificationProfile.create({ userId });
  }

  const totalXp = Number(profile.totalXp || 0);
  const derivedLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpProgress = totalXp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL - xpProgress;

  res.json({
    totalXp,
    level: derivedLevel,
    streakDays: profile.streakDays,
    badges: profile.badges || [],
    xpProgress,
    xpForNextLevel,
    xpPerLevel: XP_PER_LEVEL,
  });
});

// @desc    Get stage progress for a specific domain
export const getStageProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain } = req.query;

  if (!domain || !['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid or missing domain');
  }

  const stages = await StageProgress.find({ userId, domain });

  // Ensure all 4 stages exist
  const stageMap = {};
  for (let i = 1; i <= 4; i++) {
    const stage = stages.find((s) => s.stageId === i);
    stageMap[i] = stage || {
      userId,
      domain,
      stageId: i,
      completedGames: 0,
      progress: 0,
    };
  }

  res.json({
    domain,
    stages: Object.values(stageMap),
  });
});

// @desc    Complete a game and award XP
export const completeGame = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain, stageId, gameType, topicName, score, totalQuestions } = req.body;

  // Validation
  if (!domain || !['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid domain');
  }
  if (!stageId || stageId < 1 || stageId > 4) {
    res.status(400);
    throw new Error('Invalid stage ID');
  }
  if (!gameType || !['sprint', 'spin', 'flashcards', 'boss_battle'].includes(gameType)) {
    res.status(400);
    throw new Error('Invalid game type');
  }

  // Get or create gamification profile
  let profile = await GamificationProfile.findOne({ userId });
  if (!profile) {
    profile = await GamificationProfile.create({ userId });
  }

  // Get or create stage progress
  let stageProgress = await StageProgress.findOne({ userId, domain, stageId });
  if (!stageProgress) {
    stageProgress = await StageProgress.create({ userId, domain, stageId });
  }

  // Calculate XP earned
  const xpEarned = XP_REWARDS[gameType] || 100;
  const passed =
    gameType === 'boss_battle'
      ? true
      : score >= (totalQuestions ? Math.ceil(totalQuestions * 0.6) : 3);

  // A game can award XP only once per user+domain+stage+gameType.
  const completedGameTypes = await XPLog.distinct('source', {
    userId,
    domain,
    stageId,
    xpAmount: { $gt: 0 },
  });
  const hasCompletedThisGame = completedGameTypes.includes(gameType);

  let xpGiven = 0;
  if (passed) {
    const streakBefore = profile.streakDays || 0;
    updateDailyStreak(profile);

    if (!hasCompletedThisGame) {
      xpGiven = xpEarned;
      profile.totalXp += xpEarned;
      profile.level = Math.floor(profile.totalXp / XP_PER_LEVEL) + 1;

      // Log XP transaction (first-time completion only)
      await XPLog.create({
        userId,
        source: gameType,
        domain,
        stageId,
        topicName,
        xpAmount: xpEarned,
      });
    }

    if (
      xpGiven > 0 ||
      (profile.streakDays || 0) !== streakBefore ||
      !profile.lastActivityDate
    ) {
      await profile.save();
    }
  }

  // Stage completion is based on unique minigames completed, not replay count.
  const uniqueCompletedCount = Math.min(
    4,
    completedGameTypes.length + (passed && !hasCompletedThisGame ? 1 : 0)
  );
  const normalizedProgress = (uniqueCompletedCount / 4) * 100;

  if (
    stageProgress.completedGames !== uniqueCompletedCount ||
    stageProgress.progress !== normalizedProgress
  ) {
    stageProgress.completedGames = uniqueCompletedCount;
    stageProgress.progress = normalizedProgress;
    await stageProgress.save();
  }

  // Log performance metrics
  await PerformanceLog.create({
    userId,
    domain,
    gameType,
    topic: topicName,
    stageId,
    score: score || 0,
    accuracy: totalQuestions ? (score / totalQuestions) * 100 : 0,
    passed,
    xpAwarded: xpGiven,
  });

  const xpForNextLevel = XP_PER_LEVEL - (profile.totalXp % XP_PER_LEVEL);
  const xpProgress = profile.totalXp % XP_PER_LEVEL;

  res.json({
    success: true,
    xpEarned: xpGiven,
    totalXp: profile.totalXp,
    level: profile.level,
    xpProgress,
    xpForNextLevel,
    stageProgress: {
      stageId,
      completedGames: stageProgress.completedGames,
      progress: stageProgress.progress,
    },
  });
});

// @desc    Get or generate questions for a game
export const getQuestions = asyncHandler(async (req, res) => {
  const { domain, topic, gameType } = req.query;

  // Validation
  if (!domain || !topic || !gameType) {
    res.status(400);
    throw new Error('Missing domain, topic, or gameType');
  }

  if (!['placements', 'higher_studies', 'entrepreneurship'].includes(domain)) {
    res.status(400);
    throw new Error('Invalid domain');
  }

  if (!['sprint', 'spin', 'flashcards', 'boss_battle'].includes(gameType)) {
    res.status(400);
    throw new Error('Invalid game type');
  }

  // Check if cached (skip boss cache so quality improvements apply immediately)
  const shouldUseCache = gameType !== 'boss_battle';
  let cached = shouldUseCache ? await QuestionCache.findOne({ domain, topic, gameType }) : null;
  if (cached) {
    const sanitizedCached = sanitizeQuestionsByType(gameType, cached.questions, topic);

    if (JSON.stringify(sanitizedCached) !== JSON.stringify(cached.questions)) {
      try {
        cached.questions = sanitizedCached;
        cached.createdAt = new Date();
        await cached.save();
      } catch (cacheRepairErr) {
        console.error('Cache repair error (non-blocking):', cacheRepairErr);
      }
    }

    return res.json({
      questions: sanitizedCached,
      cached: true,
    });
  }

  // Generate new questions
  let questions;
  try {
    switch (gameType) {
      case 'sprint':
        questions = await generateSprintQuestions(domain, topic);
        break;
      case 'flashcards':
        questions = await generateFlashcards(domain, topic);
        break;
      case 'boss_battle':
        questions = await generateBossBattleQuestions(domain, topic);
        break;
      case 'spin':
        questions = await generateSpinQuestions(domain, topic);
        break;
      default:
        questions = [];
    }
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500);
    throw new Error('Failed to generate questions');
  }

  const sanitizedQuestions = sanitizeQuestionsByType(gameType, questions, topic);

  // Cache the result
  try {
    await QuestionCache.findOneAndUpdate(
      { domain, topic, gameType },
      { questions: sanitizedQuestions, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (cacheErr) {
    console.error('Cache error (non-blocking):', cacheErr);
  }

  res.json({
    questions: sanitizedQuestions,
    cached: false,
  });
});

// @desc    Get domain topics for a stage
export const getDomainTopics = asyncHandler(async (req, res) => {
  const { domain, stageId } = req.query;

  if (!domain || !stageId) {
    res.status(400);
    throw new Error('Missing domain or stageId');
  }

  const topics = await generateDomainTopics(domain, parseInt(stageId));

  res.json({
    domain,
    stageId: parseInt(stageId),
    topics,
  });
});

// @desc    Get user's weekly leaderboard rank
export const getLeaderboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 10, domain } = req.query;

  // Calculate week start date
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // Aggregate XP from this week
  const leaderboardAgg = await XPLog.aggregate([
    {
      $match: {
        createdAt: { $gte: weekStart },
        ...(domain && { domain }),
      },
    },
    {
      $group: {
        _id: '$userId',
        weeklyXp: { $sum: '$xpAmount' },
      },
    },
    {
      $sort: { weeklyXp: -1 },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
  ]);

  const leaders = await Promise.all(
    leaderboardAgg.map(async (entry, index) => {
      const profile = await GamificationProfile.findOne({ userId: entry._id });
      const totalXp = Number(profile?.totalXp || 0);
      return {
        rank: index + 1,
        userId: entry._id,
        name: entry.userInfo[0]?.name || 'Unknown',
        profileImage: entry.userInfo[0]?.profileImage || '',
        level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
        weeklyXp: entry.weeklyXp,
        isCurrentUser: entry._id.toString() === userId.toString(),
      };
    })
  );

  // Find current user's rank if not in top 10
  let currentUserRank = leaders.find((l) => l.isCurrentUser);
  if (!currentUserRank) {
    const allLeaderboard = await XPLog.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
          ...(domain && { domain }),
        },
      },
      {
        $group: {
          _id: '$userId',
          weeklyXp: { $sum: '$xpAmount' },
        },
      },
      {
        $sort: { weeklyXp: -1 },
      },
    ]);

    const userRankIndex = allLeaderboard.findIndex((e) => e._id.toString() === userId.toString());
    if (userRankIndex !== -1) {
      const profile = await GamificationProfile.findOne({ userId });
      const totalXp = Number(profile?.totalXp || 0);
      const user = await User.findById(userId);
      currentUserRank = {
        rank: userRankIndex + 1,
        userId,
        name: user?.name || 'You',
        profileImage: user?.profileImage || '',
        level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
        weeklyXp: allLeaderboard[userRankIndex].weeklyXp,
        isCurrentUser: true,
      };
    }
  }

  res.json({
    period: 'weekly',
    leaders,
    currentUser: currentUserRank || null,
  });
});

// @desc    Record a spin wheel reward
export const recordSpinReward = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain, rewardType, rewardValue } = req.body;

  if (!domain || !rewardType) {
    res.status(400);
    throw new Error('Missing domain or rewardType');
  }

  const reward = await SpinReward.create({
    userId,
    domain,
    rewardType,
    rewardValue: rewardValue || 'unlocked',
  });

  res.json({
    success: true,
    reward,
  });
});

// @desc    Get user's badges
export const getBadges = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await GamificationProfile.findOne({ userId });

  // Predefined badge definitions
  const allBadges = [
    { id: 'first_steps', name: 'First Steps', description: 'Complete your first game', icon: '👣' },
    {
      id: 'streak_3',
      name: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
    },
    {
      id: 'level_10',
      name: 'Expert',
      description: 'Reach level 10',
      icon: '🏆',
    },
    {
      id: 'all_games',
      name: 'Game Master',
      description: 'Complete all 4 game types',
      icon: '🎮',
    },
    {
      id: 'domain_master',
      name: 'Domain Champion',
      description: 'Complete all 4 stages in a domain',
      icon: '👑',
    },
  ];

  const unlockedIds = (profile?.badges || []).map((b) => b.name);
  const badges = allBadges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    unlocked: unlockedIds.includes(badge.name),
    unlockedAt: profile?.badges?.find((b) => b.name === badge.name)?.unlockedAt || null,
  }));

  res.json({ badges });
});
