// backend/controllers/progressController.js
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Resource from '../models/resourceModel.js';

// @desc    Get data for the progress page
// @route   GET /api/progress/data
export const getProgressData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('completedCourses');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get all resources for the user's career path
  const allResources = await Resource.find({ careerPath: user.careerPath });

  // Group all resources by domain to find the 'target' number
  const domainTargets = allResources.reduce((acc, resource) => {
    const domain = resource.domain;
    if (!acc[domain]) {
      acc[domain] = 0;
    }
    acc[domain]++;
    return acc;
  }, {});
  
  // Group completed courses by domain
  const completedByDomain = user.completedCourses.reduce((acc, course) => {
    const domain = course.domain;
    if (!acc[domain]) {
      acc[domain] = 0;
    }
    acc[domain]++;
    return acc;
  }, {});

  // Create the skills development data structure
  const skillDomains = Object.keys(domainTargets).map(domain => ({
    name: domain,
    completed: completedByDomain[domain] || 0,
    target: domainTargets[domain],
  }));

   res.json({
    completedMilestones: user.completedMilestones,
    skillDomains: skillDomains,
    careerPath: user.careerPath, // <-- ADD THIS LINE
  });
});


// @desc    Toggle a milestone's completion status
// @route   PUT /api/progress/milestones
export const toggleMilestone = asyncHandler(async (req, res) => {
  const { milestoneId } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    const isCompleted = user.completedMilestones.includes(milestoneId);

    if (isCompleted) {
      // If already completed, remove it (un-tick)
      user.completedMilestones = user.completedMilestones.filter(id => id !== milestoneId);
    } else {
      // If not completed, add it (tick)
      user.completedMilestones.push(milestoneId);
    }

    await user.save();
    res.json({ completedMilestones: user.completedMilestones });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});