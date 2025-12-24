import express from 'express'
import { renderBookingPage} from '../controllers/booking.js';
const router = express.Router();

router.get('/',renderBookingPage);


export default router;