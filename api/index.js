import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoute from './routes/auth.js';
import hotelsRoute from './routes/hotels.js';
import roomsRoute from './routes/rooms.js';
import usersRoute from './routes/users.js';
import bookingsRoute from './routes/booking.js';
import commentRoute from './routes/comment.js';
import postsRoute from './routes/post.js'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authGoogleRoute from './routes/authGoogle.js'
import passport from './config/passport.js'; 
dotenv.config();
mongoose.set('strictQuery', false);

const app = express();
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log('Connected to mongoDB.');
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('mongoDB disconnected!');
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://group-project-cosc3060-cosc3061-2024b-g2.onrender.com'],
  credentials: true, 

}));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoute);
app.use('/api/hotels', hotelsRoute);
app.use('/api/rooms', roomsRoute);
app.use('/api/users', usersRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/comments', commentRoute);
app.use('/api/posts', postsRoute)
app.use('/', authGoogleRoute); 

app.use(async (err, req, res, next) => {
  const statusError = err.status || 500;
  const messageError = err.message || 'Something is wrong';
  return res.status(statusError).json({
    success: false,
    status: statusError,
    message: messageError,
    stack: err.stack,
  });
});
const PORT = 8800;

app.listen(PORT, () => {
  connect();
  console.log(`Listening backend on port ${PORT}`);
});