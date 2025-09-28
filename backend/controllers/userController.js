import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  const { name, email, password, department, semester, dateOfBirth } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name, email, password, department, semester, dateOfBirth
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Update user's career path
// @route   PUT /api/users/career-path
export const updateUserCareerPath = async (req, res) => {
    const { userId, careerPath } = req.body;
    const user = await User.findById(userId);

    if (user) {
        user.careerPath = careerPath;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            careerPath: updatedUser.careerPath,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Return all user data needed for the profile
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
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Update all editable fields
    user.skills = req.body.skills ?? user.skills;
    user.workExperience = req.body.workExperience ?? user.workExperience;
    user.certifications = req.body.certifications ?? user.certifications;
    user.linkedinUrl = req.body.linkedinUrl ?? user.linkedinUrl;
    user.githubUrl = req.body.githubUrl ?? user.githubUrl;
    user.portfolioUrl = req.body.portfolioUrl ?? user.portfolioUrl;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};