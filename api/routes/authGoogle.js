import express from 'express';
import { googleAuth, googleAuthCallbackJSON } from '../controllers/authGoogle.js';
import passport from 'passport';
const router = express.Router();

// Google OAuth login route
router.get('/auth/google', googleAuth);

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:3000?error=account_locked', session: false }), googleAuthCallbackJSON);



export default router;