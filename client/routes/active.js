import express from 'express'
import { renderActivePage} from '../controllers/active.js';
const router = express.Router();

router.get('/:token',renderActivePage);


export default router;