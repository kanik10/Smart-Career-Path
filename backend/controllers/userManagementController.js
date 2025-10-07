// backend/controllers/userManagementController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users with stats
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
    // Get all non-admin users
    const users = await User.find({ isAdmin: false })
        .select('-password')
        .sort({ createdAt: -1 });

    // Calculate stats
    const totalStudents = users.length;
    const activeAccounts = users.filter(user => user.status === 'active').length;
    const placementTrack = users.filter(user => user.careerPath === 'placement').length;
    const uniqueDepartments = new Set(users.map(user => user.department)).size;

    res.json({
        users,
        stats: {
            totalStudents,
            activeAccounts,
            placementTrack,
            departments: uniqueDepartments
        }
    });
});

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const newStatus = req.body.status;
    if (!['active', 'inactive'].includes(newStatus)) {
        res.status(400);
        throw new Error('Invalid status value');
    }

    user.status = newStatus;
    await user.save();

    res.json({ message: 'User status updated successfully' });
});

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
export const resetUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate a temporary password (you might want to implement your own logic)
    const tempPassword = 'vppcoe@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ 
        message: 'Password reset successful',
        tempPassword // In production, you'd want to send this via email
    });
});