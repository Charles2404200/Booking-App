import express from 'express'
import { renderProfilePage } from '../controllers/profile.js';
const router = express.Router();


router.get('/', renderProfilePage);


export default router;

