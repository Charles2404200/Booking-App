import express from 'express';
import { createComment, updateComment, deleteComment, getCommentsByHotel, replyComment, likesComment, getCommentsbyUser } from '../controllers/comment.js';
import { verifyStatus } from '../utils/verifyToken.js';

const router = express.Router();

// Create a new comment
router.post('/',verifyStatus, createComment);
//reply
router.post('/reply',verifyStatus, replyComment); // Add this line for replying to comments
// Update a comment by ID
router.put('/:commentId',verifyStatus, updateComment);

// Delete a comment by ID
router.delete('/:commentId',verifyStatus,  deleteComment);

// Get comments by hotel ID
router.get('/hotel/:hotelId', getCommentsByHotel);
//Like
router.put('/likes/:commentId',verifyStatus, likesComment);
router.get("/user/:userId", getCommentsbyUser);
export default router;