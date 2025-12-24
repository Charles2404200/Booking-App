import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import flash from 'connect-flash';
import fs from 'fs';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// These lines will give you the equivalent of `__dirname` in an ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import upload from './config/multer.js';
dotenv.config();

import aboutRoute from './routes/about.js';
import activeRoute from './routes/active.js';
import adminRoute from './routes/admin.js';
import bookingRoute from './routes/booking.js';
import forumRoute from './routes/forum.js';
import homeRoutes from './routes/home.js';
import hotelRoute from './routes/hotel.js';
import imageRoute from './routes/image.js';
import profileRoute from './routes/profile.js';
import sitemapRoute from './routes/sitemap.js'; // Adjust the path if necessary


const app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');

// Middleware 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('uploads'))
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

// Middleware to decode JWT and set res.locals.user
app.use(async (req, res, next) => {
  const token = req.cookies.access_token;
  if (token) {
    try {
      console.log(process.env.JWT);

      const decoded = jwt.verify(token, process.env.JWT || '8hEnPGeoBqGUT6zksxt4G95gW+uMdzwe7EVaRnp0xRI');
      const userResponse = await axios.get(`https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/users/${decoded.id}`, { withCredentials: true });
      res.locals.user = userResponse.data || null;
    } catch (err) {
      console.error('Error decoding token:', err.message);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  res.locals.error_msg = req.flash('error_msg');
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to protect routes
app.use((req, res, next) => {
  const unprotectedRoutes = ['/', '/auth/google', '/forgot-password','/forum','/about','/sitemap'];
  if (unprotectedRoutes.includes(req.path)) {
    return next();
  }

  if (!res.locals.user) {
    return res.redirect('/');
  }
  if (req.path.startsWith('/admin')) {
    // Verify if the user is an admin
    if (!res.locals.user.isAdmin) {
      return res.redirect('/');
    }
  }
  next();
});

// Use Routes
app.use('/', homeRoutes);
app.use('/profile', profileRoute);
app.use('/forum', forumRoute);
app.use('/activate', activeRoute);
app.use('/admin', adminRoute);
app.use('/about', aboutRoute);
app.use('/hotel', hotelRoute);
app.use('/booking', bookingRoute);
app.use('/', imageRoute);
app.use('/sitemap', sitemapRoute);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { error: err });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
