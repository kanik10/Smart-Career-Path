// backend/controllers/dashboardController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Todo from '../models/todoModel.js';
import Resource from '../models/resourceModel.js';

// @desc    Get aggregated data for the student dashboard
// @route   GET /api/dashboard/data
// @access  Private
export const getDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch user profile data
    const userProfile = await User.findById(userId)
        .select('-password')
        .lean();

    // Fetch user's todos
    const todos = await Todo.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

    // Calculate statistics
    const stats = {
        coursesEnrolled: userProfile.enrolledCourses?.length || 0,
        coursesCompleted: userProfile.completedCourses?.length || 0,
        certificates: userProfile.certifications?.length || 0
    };

    // Get current focus based on career path and progress
    let currentFocus = [];
    if (userProfile.careerPath === 'placement') {
        currentFocus = [
            { _id: '1', title: 'Resume Building', domain: 'Career Development' },
            { _id: '2', title: 'Interview Preparation', domain: 'Soft Skills' },
            { _id: '3', title: 'Technical Interview Practice', domain: 'Technical' }
        ];
    } else if (userProfile.careerPath === 'higher-studies') {
        currentFocus = [
            { _id: '1', title: 'Entrance Exam Preparation', domain: 'Academic' },
            { _id: '2', title: 'Research Paper Reading', domain: 'Research' },
            { _id: '3', title: 'University Selection', domain: 'Planning' }
        ];
    } else if (userProfile.careerPath === 'entrepreneurship') {
        currentFocus = [
            { _id: '1', title: 'Business Plan Development', domain: 'Planning' },
            { _id: '2', title: 'Market Research', domain: 'Research' },
            { _id: '3', title: 'Networking Skills', domain: 'Soft Skills' }
        ];
    } else {
        currentFocus = [
            { _id: '1', title: 'Complete Career Assessment', domain: 'Planning' },
            { _id: '2', title: 'Explore Career Paths', domain: 'Research' }
        ];
    }

    // Get recent achievements
    const recentAchievements = [
        ...userProfile.completedCourses?.slice(-3).map(course => `Completed ${course}`) || [],
        ...userProfile.certifications?.slice(-3).map(cert => `Earned ${cert}`) || []
    ].slice(0, 3);

    // Send response
    res.json({
        userProfile: {
            name: userProfile.name,
            department: userProfile.department,
            profilePicture: userProfile.profilePicture,
            email: userProfile.email
        },
        stats,
        currentFocus,
        recentAchievements,
        todos
    });
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
        
    // Get leaderboard data (top 5 students by completed courses)
    const leaderboard = await User.aggregate([
        { $match: { isAdmin: false } },
        { $project: {
            name: 1,
            completedCoursesCount: { $size: { $ifNull: ['$completedCourses', []] } }
        }},
        { $sort: { completedCoursesCount: -1 } },
        { $limit: 5 }
    ]);

    res.json({
        stats: {
            totalStudents,
            newSignups,
            resourcesCount
        },
        careerPathDistribution: distribution,
        leaderboard,
        recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            date: user.createdAt.toISOString().split('T')[0]
        }))
    });
});