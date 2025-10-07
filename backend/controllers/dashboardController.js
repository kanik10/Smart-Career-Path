// backend/controllers/dashboardController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Todo from '../models/todoModel.js';

// @desc    Get aggregated data for the student dashboard
// @route   GET /api/dashboard/data
// @access  Private
export const getDashboardData = asyncHandler(async (req, res) => {
  // 1. Get the user and populate course details in one go
  const user = await User.findById(req.user._id)
    .populate('enrolledCourses', 'title domain')  // Populate for 'Current Focus'
    .populate('completedCourses', 'title');       // Populate for 'Recent Achievements'

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 2. Get the user's to-do list
  const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });

  // 3. Dynamically generate 'Recent Achievements'
  const achievements = [];
  // Add last completed course
  if (user.completedCourses.length > 0) {
    const lastCompleted = user.completedCourses[user.completedCourses.length - 1];
    achievements.push(`Completed course: "${lastCompleted.title}"`);
  }
  // Add last added skill
  if (user.skills.length > 0) {
    achievements.push(`New skill added: ${user.skills[user.skills.length - 1]}`);
  }
  // Add last added certification
  if (user.certifications.length > 0) {
    achievements.push(`Earned certificate: ${user.certifications[user.certifications.length - 1]}`);
  }
  // Add last work experience
  if (user.workExperience.length > 0) {
    achievements.push(`New experience: ${user.workExperience[user.workExperience.length - 1]}`);
  }

  // 4. Assemble the complete data payload for the frontend
  const dashboardData = {
    userProfile: {
      name: user.name,
      department: user.department,
      profilePicture: user.profilePicture,
    },
    stats: {
      coursesEnrolled: user.enrolledCourses.length,
      coursesCompleted: user.completedCourses.length,
      certificates: user.certifications.length, // Fetches from user profile
    },
    // The 'title' and 'domain' come from the populated data
    currentFocus: user.enrolledCourses.slice(0, 3), 
    recentAchievements: achievements.slice(0, 3), // Show the latest 3 achievements
    todos: todos,
  };

  res.json(dashboardData);
});