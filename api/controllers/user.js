import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import { createError } from '../utils/error.js'; 
const resetPassword = async (newPassword, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return hashedPassword;
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { password, ...otherFields } = req.body;

    // If the password is provided, hash it
    if (password) {
      otherFields.password = await resetPassword(password, next);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: otherFields },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json("User has been deleted.");
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUserByName = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {

  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};


export const createUser = async (req, res, next) => {
  try {
      const { username, email, password, fname, lname, dob, country, city, phone, status, img, isAdmin } = req.body;
      // Validate required fields
      if (!username || !email || !password) {
          return next(createError(400, 'Username, email, and password are required.'));
      }

      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return next(createError(409, 'User with this email already exists.'));
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new user instance
      const newUser = new User({
          username,
          email,
          password: hashedPassword,
          fname,
          lname,
          date: dob,  // Assuming dob corresponds to the `date` field in your schema
          country,
          city,
          phone,
          status: status || 'disabled', // Default status to 'disabled' if not provided
          img,
          isAdmin: isAdmin || false, // Default to false if not provided
      });

      // Save the user to the database
      const savedUser = await newUser.save();

      // Send a success response
      res.status(201).json({
          message: 'User created successfully!',
          user: {
              id: savedUser._id,
              username: savedUser.username,
              email: savedUser.email,
              fname: savedUser.fname,
              lname: savedUser.lname,
              date: savedUser.date,
              country: savedUser.country,
              city: savedUser.city,
              phone: savedUser.phone,
              status: savedUser.status,
              img: savedUser.img,
              isAdmin: savedUser.isAdmin,
              createdAt: savedUser.createdAt,
              updatedAt: savedUser.updatedAt,
          }
      });
  } catch (error) {
      console.error('Error creating user:', error);
      next(createError(500, 'An error occurred while creating the user.'));
  }
};
