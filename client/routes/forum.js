import express from 'express'
import { renderForumPage } from '../controllers/forum.js';
const router = express.Router();


router.get('/', renderForumPage);


export default router;

