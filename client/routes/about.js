import express from 'express'
import { renderAboutPage } from '../controllers/about.js';
const router = express.Router();


router.get('/', renderAboutPage);


export default router;

