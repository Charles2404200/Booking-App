import passport from 'passport';
import jwt from 'jsonwebtoken';
import { createError } from "../utils/error.js";
// Route for initiating Google OAuth authentication
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });



// Alternative method to handle login using a token response in JSON instead of redirect
export const googleAuthCallbackJSON = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(createError(404, 'User not found'));  }
 
  try {
    const { password, isAdmin,status, ...OtherDetails } = user._doc; 
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT,
      { expiresIn: '1d' }
    );

    res.cookie('access_token', token, { httpOnly: true,
      secure: true, 
      sameSite: 'None', 
      maxAge: 24 * 60 * 60 * 1000
    });
      res.redirect('http://localhost:3000');
  } catch (error) {
    const errorMessage = error.response && error.response.data && error.response.data.message
    ? error.response.data.message
    : error.message || 'Login failed';

    res.redirect('http://localhost:3000',{error:errorMessage})
  }
};