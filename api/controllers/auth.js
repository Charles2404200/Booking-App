import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import axios from 'axios';
dotenv.config();
async function verifyRecaptcha(recaptchaResponse) {
  const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`;

  const response = await axios.post(verificationURL);
  return response.data.success;
}

export const register = [
  body('username', 'Username is required').notEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingUserByUsername = await User.findOne({ username: req.body.username });
      if (existingUserByUsername) {
        return res.status(400).json({ errors: [{ msg: 'Username is already taken' }] });
      }

      const existingUserByEmail = await User.findOne({ email: req.body.email });
      if (existingUserByEmail) {
        return res.status(400).json({ errors: [{ msg: 'Email is already registered' }] });
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        country: '',
        date: null,
        city: '',
        phone: '',
        img: '',
        isAdmin: false,
      });

      const savedUser = await newUser.save();
      return res.status(200).json(savedUser);
    } catch (error) {
      next(error);
    }
  }
];

export const login = [
  body('username', 'Username is required').notEmpty(),
  body('password', 'Password is required').notEmpty(),
  body('recaptchaResponse', 'Captcha is required').notEmpty(),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user) {
        return next(createError(404, 'User not found'));
      }

      const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordCorrect) {
        return next(createError(400, 'Wrong password or user name'));
      }

      const { password, isAdmin,status, ...OtherDetails } = user._doc;
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT,{ expiresIn: '1d' }
      );
      const isCaptchaValid = await verifyRecaptcha(req.body.recaptchaResponse);
      
      if (!isCaptchaValid) {
          return next(createError(400,'Invalid Captcha'));
      }

      res.cookie('access_token', token, { httpOnly: true,
        secure: true, 
        sameSite: 'None', 
        maxAge: 24 * 60 * 60 * 1000
      })
        .status(200).json({ details: OtherDetails, isAdmin , status});
    } catch (error) {
      next(error);
    }
  }
];

export const logout = (req, res) => {
  res.cookie('access_token', '', { expires: new Date(0), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const generateOTP = () => {
  return crypto.randomBytes(3).toString('hex');
};

const sendEmail = async (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject,
    html: message
  };

  await transporter.sendMail(mailOptions);
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const otp = generateOTP();
    const otpExpiry = Date.now() + 3600000;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { resetPasswordOTP: otp, resetPasswordExpires: otpExpiry } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = `<p>Your password reset OTP is: <strong>${otp}</strong></p>
           <p>It will be valid for 1 hour. Check your Spam or Trash folder if you cannot find the email.</p>`;
    await sendEmail(user.email, 'Password Reset OTP', message);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully', user });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const sendActivationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ message: 'Account is already active' });
    }

    const activationToken = crypto.randomBytes(20).toString('hex');
    user.activationToken = activationToken;
    user.activationExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const activationLink = `${process.env.CLIENT_URL}activate/${activationToken}`;
    const message = `<p>Click the link to activate your account: <a href="${activationLink}">${activationLink}</a></p>`;
    await sendEmail(user.email, 'Account Activation', message);

    res.status(200).json({ message: 'Activation email sent. Please check your email to activate your account.' });
  } catch (error) {
    next(error);
  }
};

export const activateAccount = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      activationToken: token,
      activationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired activation token' });
    }

    user.status = 'active';
    user.activationToken = undefined;
    user.activationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    next(error);
  }
};