// backend/controllers/userManagementController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

export const getUsers = asyncHandler(async (req, res) => {
  // Get all non-admin users
  const users = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });

  // Calculate stats
  const totalStudents = users.length;
  const activeAccounts = users.filter(user => user.status === 'active').length;
  const placementTrack = users.filter(user => user.careerPath === 'placements').length;
  const uniqueDepartments = new Set(users.map(user => user.department)).size;

  res.json({
    users,
    stats: { totalStudents, activeAccounts, placementTrack, departments: uniqueDepartments }
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.status = req.body.status;
  await user.save();
  res.json({ message: 'User status updated successfully' });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const tempPassword = 'vppcoe@123';
  user.password = tempPassword; // Pre-save hook will hash this
  await user.save();
  res.json({ message: `Password reset successfully. Temp password: ${tempPassword}` });
});

// --- ADD THIS NEW FUNCTION ---
export const updateUserCareerPathByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  
  const { careerPath } = req.body;
  if (!['placements', 'higher-studies', 'entrepreneurship'].includes(careerPath)) {
    res.status(400);
    throw new Error('Invalid career path');
  }

  user.careerPath = careerPath;
  await user.save();
  res.json({ message: 'Career path updated successfully' });
});