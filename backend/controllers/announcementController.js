import Announcement from '../models/announcementModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
const getAnnouncements = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
  
  // Count announcements by category for ongoing announcements
  const ongoingAnnouncements = announcements.filter(a => a.status === 'ongoing');
  const counts = {
    event: ongoingAnnouncements.filter(a => a.category === 'event').length,
    placement: ongoingAnnouncements.filter(a => a.category === 'placement').length,
    workshop: ongoingAnnouncements.filter(a => a.category === 'workshop').length,
    internship: ongoingAnnouncements.filter(a => a.category === 'internship').length,
  };

  res.json({ announcements, counts });
});

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Admin
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, date, venue } = req.body;

  const announcement = await Announcement.create({
    title,
    description,
    category,
    date,
    venue,
  });

  res.status(201).json(announcement);
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Admin
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: Date.now() },
    { new: true }
  );

  res.json(updatedAnnouncement);
});

// @desc    Mark announcement as completed
// @route   PUT /api/announcements/:id/complete
// @access  Admin
const completeAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  announcement.status = 'completed';
  announcement.updatedAt = Date.now();
  await announcement.save();

  res.json(announcement);
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  await announcement.deleteOne();
  res.json({ message: 'Announcement removed' });
});

export {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  completeAnnouncement,
  deleteAnnouncement,
};