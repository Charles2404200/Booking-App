import express from 'express'
import { renderAdminPage } from '../controllers/admin.js';

const router  = express.Router();

router.get('/', renderAdminPage);


export default router;