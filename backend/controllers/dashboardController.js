// backend/controllers/dashboardController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Todo from '../models/todoModel.js';
import Resource from '../models/resourceModel.js';

// @desc    Get aggregated data for the student dashboard
// @route   GET /api/dashboard/data
// @access  Private
export const getDashboardData = asyncHandler(async (req, res) => {
  // ... existing student dashboard code ...
});

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin/stats
// @access  Private/Admin
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
    // Get total students count
    const totalStudents = await User.countDocuments({ isAdmin: false });
    
    // Get new signups in last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newSignups = await User.countDocuments({
        isAdmin: false,
        createdAt: { $gte: lastWeek }
    });

    // Get total resources count
    const resourcesCount = await Resource.countDocuments();

    // Get career path distribution
    const placementCount = await Resource.countDocuments({ careerPath: 'placements' });
    const higherStudiesCount = await Resource.countDocuments({ careerPath: 'higher-studies' });
    const entrepreneurshipCount = await Resource.countDocuments({ careerPath: 'entrepreneurship' });
    
    const total = placementCount + higherStudiesCount + entrepreneurshipCount;
    const distribution = {
        placement: Math.round((placementCount / total) * 100) || 0,
        higherStudies: Math.round((higherStudiesCount / total) * 100) || 0,
        entrepreneurship: Math.round((entrepreneurshipCount / total) * 100) || 0
    };

    // Get recent registrations
    const recentUsers = await User.find({ isAdmin: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt');

    res.json({
        stats: {
            totalStudents,
            newSignups,
            resourcesCount
        },
        careerPathDistribution: distribution,
        recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            date: user.createdAt.toISOString().split('T')[0]
        }))
    });
});