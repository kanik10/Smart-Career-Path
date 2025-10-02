// backend/controllers/announcementController.js
import Announcement from '../models/announcementModel.js';
import asyncHandler from 'express-async-handler';

export const getAnnouncements = asyncHandler(async (req, res) => {
  let announcements = await Announcement.find({}).sort({ date: -1 });

  // Add a dynamic 'isPast' flag to each announcement
  announcements = announcements.map(ann => {
    const annObject = ann.toObject(); // Convert Mongoose doc to plain object
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

// ... (rest of the controller remains the same)
export const createAnnouncement = asyncHandler(async (req, res) => { /* ... */ });
export const updateAnnouncement = asyncHandler(async (req, res) => { /* ... */ });
export const completeAnnouncement = asyncHandler(async (req, res) => { /* ... */ });
export const deleteAnnouncement = asyncHandler(async (req, res) => { /* ... */ });