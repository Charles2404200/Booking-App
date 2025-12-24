import express from 'express'
import { renderHotelPage} from '../controllers/hotel.js';
const router = express.Router();

router.get('/',renderHotelPage);


export default router;