// backend/controllers/resourceController.js
import Resource from '../models/resourceModel.js';
import asyncHandler from 'express-async-handler';

export const getResources = asyncHandler(async (req, res) => {
  const { careerPath, type, domain, prioritizeDomain } = req.query;
  const filter = {};
  if (careerPath) filter.careerPath = careerPath;
  if (type) filter.type = type;
  if (domain) filter.domain = domain;

  const resources = await Resource.find(filter).sort({ createdAt: -1 });

  if (prioritizeDomain) {
    const normalizedPreferred = String(prioritizeDomain).trim().toLowerCase();
    const prioritized = [...resources].sort((a, b) => {
      const aPreferred = String(a.domain || '').trim().toLowerCase() === normalizedPreferred ? 1 : 0;
      const bPreferred = String(b.domain || '').trim().toLowerCase() === normalizedPreferred ? 1 : 0;
      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred;
      }
      return 0;
    });
    return res.json(prioritized);
  }

  res.json(resources);
});

export const createResource = asyncHandler(async (req, res) => {
  // Simplified fields
  const { title, domain, url, description, instructor, thumbnailUrl, duration, type, careerPath } = req.body;
  const resource = await Resource.create({
    title, domain, url, description, instructor, thumbnailUrl, duration, type, careerPath
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