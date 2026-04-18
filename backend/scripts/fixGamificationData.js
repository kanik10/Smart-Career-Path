import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  GamificationProfile,
  StageProgress,
  XPLog,
} from '../models/gamificationModel.js';

dotenv.config();

const XP_PER_LEVEL = 1000;

const toStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDayKey = (date) => {
  const d = toStartOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const calculateStreakFromDayKeys = (dayKeys = []) => {
  if (!dayKeys.length) return 0;

  const unique = Array.from(new Set(dayKeys)).sort((a, b) => (a < b ? 1 : -1));
  const todayKey = formatDayKey(new Date());
  const today = toStartOfDay(new Date());

  let first = toStartOfDay(unique[0]);
  const deltaFromToday = Math.round((today.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  if (deltaFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const prev = toStartOfDay(unique[i - 1]);
    const curr = toStartOfDay(unique[i]);
    const dayDelta = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDelta === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  if (unique[0] !== todayKey) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (unique[0] !== formatDayKey(yesterday)) {
      return 0;
    }
  }

  return streak;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Use earliest completion per user+domain+stage+game source.
  const logs = await XPLog.find({ xpAmount: { $gt: 0 } })
    .sort({ createdAt: 1 })
    .lean();

  const seenCompletion = new Set();
  const totalXpByUser = new Map();
  const completedByStage = new Map();
  const activeDaysByUser = new Map();

  for (const log of logs) {
    const userId = String(log.userId);
    const dayKey = formatDayKey(log.createdAt);
    if (!activeDaysByUser.has(userId)) {
      activeDaysByUser.set(userId, []);
    }
    activeDaysByUser.get(userId).push(dayKey);

    const stageKey = `${userId}|${log.domain}|${log.stageId}`;
    const completionKey = `${stageKey}|${log.source}`;

    if (seenCompletion.has(completionKey)) {
      continue;
    }

    seenCompletion.add(completionKey);

    const prevXp = totalXpByUser.get(userId) || 0;
    totalXpByUser.set(userId, prevXp + (log.xpAmount || 0));

    if (!completedByStage.has(stageKey)) {
      completedByStage.set(stageKey, new Set());
    }
    completedByStage.get(stageKey).add(log.source);
  }

  const allUserIds = new Set();
  (await GamificationProfile.find({}, { userId: 1 }).lean()).forEach((p) => {
    allUserIds.add(String(p.userId));
  });
  Array.from(totalXpByUser.keys()).forEach((id) => allUserIds.add(id));

  let profileUpdates = 0;
  for (const userId of allUserIds) {
    const totalXp = totalXpByUser.get(userId) || 0;
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const dayKeys = activeDaysByUser.get(userId) || [];
    const streakDays = calculateStreakFromDayKeys(dayKeys);
    const lastActivityDate = dayKeys.length
      ? toStartOfDay(dayKeys.sort((a, b) => (a < b ? 1 : -1))[0])
      : null;

    await GamificationProfile.findOneAndUpdate(
      { userId },
      {
        totalXp,
        level,
        streakDays,
        ...(lastActivityDate ? { lastActivityDate } : {}),
      },
      { upsert: true }
    );
    profileUpdates += 1;
  }

  const stages = await StageProgress.find({}).lean();
  let stageUpdates = 0;

  for (const stage of stages) {
    const stageKey = `${String(stage.userId)}|${stage.domain}|${stage.stageId}`;
    const completedCount = Math.min(4, completedByStage.get(stageKey)?.size || 0);
    const progress = (completedCount / 4) * 100;

    if (stage.completedGames !== completedCount || stage.progress !== progress) {
      await StageProgress.updateOne(
        { _id: stage._id },
        { $set: { completedGames: completedCount, progress } }
      );
      stageUpdates += 1;
    }
  }

  console.log(`Profiles recalculated: ${profileUpdates}`);
  console.log(`Stage progress rows corrected: ${stageUpdates}`);
  console.log('Gamification data fix complete.');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to fix gamification data:', error);
  await mongoose.disconnect();
  process.exit(1);
});
