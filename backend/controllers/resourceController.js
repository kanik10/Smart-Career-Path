// backend/controllers/resourceController.js
import Resource from '../models/resourceModel.js';
import asyncHandler from 'express-async-handler';

export const getResources = asyncHandler(async (req, res) => {
  const { careerPath, type } = req.query;
  const filter = {};
  if (careerPath) filter.careerPath = careerPath;
  if (type) filter.type = type;
  const resources = await Resource.find(filter).sort({ createdAt: -1 });
  res.json(resources);
});

export const createResource = asyncHandler(async (req, res) => {
  // Simplified fields
  const { title, domain, url, instructor, thumbnailUrl, duration, type, careerPath } = req.body;
  const resource = await Resource.create({
    title, domain, url, instructor, thumbnailUrl, duration, type, careerPath
  });
  res.status(201).json(resource);
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (resource) {
    await resource.deleteOne();
    res.json({ message: 'Resource removed' });
  } else {
    res.status(404);
    throw new Error('Resource not found');
  }
});