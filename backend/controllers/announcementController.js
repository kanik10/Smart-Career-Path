import Announcement from '../models/announcementModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all announcements
// @route   GET /api/announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  let announcements = await Announcement.find({}).sort({ date: -1 });

  // Add a dynamic 'isPast' flag to each announcement for the student view
  announcements = announcements.map(ann => {
    const annObject = ann.toObject();
    annObject.isPast = new Date(annObject.date) < new Date() || annObject.status === 'completed';
    return annObject;
  });

  const ongoing = announcements.filter(a => !a.isPast);
  
  const counts = {
    placement: 0, internship: 0, workshop: 0, drive: 0,
    counselling: 0, 'higher study seminar': 0, seminar: 0, others: 0
  };

  ongoing.forEach(announcement => {
    if (counts.hasOwnProperty(announcement.category)) {
      counts[announcement.category]++;
    }
  });

  counts.upcoming = ongoing.length;

  res.json({ announcements, counts });
});

// @desc    Create a new announcement
// @route   POST /api/announcements
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, date, venue, rsvpLink } = req.body;
  if (!title || !description || !category || !date || !venue) {
    res.status(400);
    throw new Error('All required fields must be filled');
  }
  const announcement = await Announcement.create({
    title, description, category, date, venue, rsvpLink
  });
  res.status(201).json(announcement);
});

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, date, venue, rsvpLink } = req.body;
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  announcement.title = title || announcement.title;
  announcement.description = description || announcement.description;
  announcement.category = category || announcement.category;
  announcement.date = date || announcement.date;
  announcement.venue = venue || announcement.venue;
  announcement.rsvpLink = rsvpLink ?? announcement.rsvpLink;

  const updatedAnnouncement = await announcement.save();
  res.json(updatedAnnouncement);
});

// @desc    Mark an announcement as completed
// @route   PUT /api/announcements/:id/complete
export const completeAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  announcement.status = 'completed';
  const updatedAnnouncement = await announcement.save();
  res.json(updatedAnnouncement);
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  await announcement.deleteOne();
  res.json({ message: 'Announcement removed' });
});