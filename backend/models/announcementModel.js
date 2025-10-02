// backend/models/announcementModel.js
import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [ // Updated list of categories
      'placement', 'internship', 'workshop', 'drive',
      'counselling', 'higher study seminar', 'seminar', 'others'
    ],
  },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  rsvpLink: { type: String, default: '' }, // New RSVP link field
  status: {
    type: String,
    default: 'ongoing',
    enum: ['ongoing', 'completed'],
  },
}, {
  timestamps: true,
});

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;