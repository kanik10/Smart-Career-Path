import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, department, semester, dateOfBirth } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({
    name, email, password, department, semester, dateOfBirth
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token (UPDATED WITH STATUS CHECK)
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'inactive') {
      res.status(403); // 403 Forbidden
      throw new Error('Your account has been deactivated. Please contact an administrator.');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Update user's career path
export const updateUserCareerPath = asyncHandler(async (req, res) => {
  // This should be protected, getting user from token
  const user = await User.findById(req.user._id);
  if (user) {
    user.careerPath = req.body.careerPath;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      careerPath: updatedUser.careerPath,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      semester: user.semester,
      dateOfBirth: user.dateOfBirth,
      careerPath: user.careerPath,
      profileImage: user.profileImage,
      skills: user.skills,
      workExperience: user.workExperience,
      certifications: user.certifications,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      portfolioUrl: user.portfolioUrl,
      enrolledCourses: user.enrolledCourses,
      completedCourses: user.completedCourses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.skills = req.body.skills ?? user.skills;
    user.workExperience = req.body.workExperience ?? user.workExperience;
    user.certifications = req.body.certifications ?? user.certifications;
    user.linkedinUrl = req.body.linkedinUrl ?? user.linkedinUrl;
    user.githubUrl = req.body.githubUrl ?? user.githubUrl;
    user.portfolioUrl = req.body.portfolioUrl ?? user.portfolioUrl;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create a new admin user
export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, department, semester, dateOfBirth } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({
    name, email, password, department, semester, dateOfBirth, isAdmin: true
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Enroll user in a course
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }
    res.json({ message: 'Enrolled successfully', enrolledCourses: user.enrolledCourses });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Drop a course
export const dropCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const user = await User.findById(req.user._id);
  if (user) {
    user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId);
    await user.save();
    res.json({ message: 'Course dropped', enrolledCourses: user.enrolledCourses });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Mark a course as completed
export const completeCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId);
    if (!user.completedCourses.includes(courseId)) {
      user.completedCourses.push(courseId);
    }
    await user.save();
    res.json({ 
      message: 'Course completed',
      enrolledCourses: user.enrolledCourses,
      completedCourses: user.completedCourses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});