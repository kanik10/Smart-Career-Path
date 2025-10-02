import User from '../models/userModel.js';

export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as admin' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};