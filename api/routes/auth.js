import express from 'express';
import { register,login, logout , forgotPassword ,verifyOTP, resetPassword,activateAccount,sendActivationEmail} from '../controllers/auth.js';
import { verifyToken } from '../utils/verifyToken.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/check', verifyToken, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
  });
  router.post('/forgot-password', forgotPassword);
  router.post('/verify-otp', verifyOTP);
  router.post('/reset-password', resetPassword);
  router.get('/activate/:token', activateAccount);
  router.post('/send-activation-email', sendActivationEmail); 
  
  
  export default router;