// backend/controllers/adminController.js
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Resource from '../models/resourceModel.js';

// @desc    Get aggregated stats for the admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardData = asyncHandler(async (req, res) => {
  // 1. Get total counts
  const totalStudents = await User.countDocuments({ isAdmin: false });
  const totalResources = await Resource.countDocuments();

  // 2. Get new sign-ups in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newSignups = await User.countDocuments({
    isAdmin: false,
    createdAt: { $gte: sevenDaysAgo },
  });

  // 3. Get recent user registrations (last 5)
  const recentUsers = await User.find({ isAdmin: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email createdAt');

  // 4. Get career path distribution using aggregation
  const careerPathDistribution = await User.aggregate([
    { $match: { isAdmin: false, careerPath: { $ne: null } } },
    { $group: { _id: '$careerPath', count: { $sum: 1 } } },
    { $project: { name: '$_id', count: 1, _id: 0 } },
  ]);

  // 5. Get leaderboard data (top 5 students by completed courses)
  const leaderboard = await User.aggregate([
    { $match: { isAdmin: false } },
    { $project: { name: 1, completedCoursesCount: { $size: '$completedCourses' } } },
    { $sort: { completedCoursesCount: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    stats: { totalStudents, newSignups, totalResources },
    recentUsers,
    careerPathDistribution,
    leaderboard,
  });
});