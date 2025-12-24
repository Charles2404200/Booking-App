import jwt from 'jsonwebtoken';
import { createError } from './error.js';
import User from '../models/User.js';
const verifyToken = async (req, res, next) => {
  const token = req.cookies.access_token;

 
  if (!token) {
    next(createError(401, 'You are not authenticated'));
  } else 
  {jwt.verify(token, process.env.JWT, (err, user) => {
    if (err) {
      next(createError(403, 'Token is not valid')); 
    } else {
      req.user = user;
      // Attach decoded user to request object
      next();
    }
  });}
};

const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return next(createError(403, 'You are not authorized!'));
    }
  });
};

 const verifyAdmin = async (req, res, next) => {
  try {
    // Use verifyToken to authenticate the user and populate req.user
    await verifyToken(req, res, async () => {
      if (!req.user) {
        return next(createError(401, 'You are not authenticated: Admin'));
      }

      // Find the user by ID
      const user = await User.findById(req.user.id);
      if (!user) {
        return next(createError(404, 'User not found'));
      }

      // Check if the user is an admin
      if (!user.isAdmin) {
        console.log('Error at verify');
        return next(createError(403, 'You are not admin.'));
      }

      // If everything is fine, proceed to the next middleware
      next();
    });
  } catch (error) {
    return next(createError(500, 'Server error while verifying admin status.'));
  }
};

 const verifyStatus = async (req, res, next) => {
  verifyToken(req, res, async () => {
    try {
      // Ensure the user is authenticated
      if (!req.user) {
        return next(createError(401, 'You are not authenticated: Status'));
      }

      // Find the user by ID
      const user = await User.findById(req.user.id);
      if (!user) {
        return next(createError(404, 'User not found'));
      }

      // Check if the user's status is 'lock'
      if (user.status === 'lock') {
        return next(createError(403, 'You are locked.'));
      }

      // If everything is fine, proceed to the next middleware
      next();
    } catch (error) {
      return next(createError(500, 'Server error while verifying status.'));
    }
  });
};

export { verifyAdmin, verifyUser,verifyToken,verifyStatus };