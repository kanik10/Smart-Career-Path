// backend/models/resourceModel.js
import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  domain: { type: String, required: true },
  url: { type: String, required: true },
  instructor: { type: String }, // Renamed to 'educator' on the frontend
  thumbnailUrl: { type: String, default: '' },
  duration: { type: String },
  
  // Fields for filtering, not displayed on the card
  type: { type: String, required: true, enum: ['course', 'material'] },
  careerPath: {
    type: String,
    required: true,
    enum: ['placements', 'higher-studies', 'entrepreneurship'],
  },
}, {
  timestamps: true,
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;