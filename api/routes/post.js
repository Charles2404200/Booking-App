import express from 'express';
import {
    getPosts,
    getPostsByUserId,
    getPostsByTitle,
    createPost,
    updatePost,
    deletePost,
    likesPost,
    handleSearch
} from '../controllers/post.js';  // Adjust the path as necessary
import { verifyStatus } from '../utils/verifyToken.js';

const router = express.Router();

// Get all posts
router.get('/', getPosts);



// Create a new post
router.post('/',verifyStatus, createPost);

// Update a post by ID
router.put('/:postId',verifyStatus, updatePost);

// Delete a post by ID
router.delete('/:postId',verifyStatus, deletePost);

//Search
router.get('/search',handleSearch);

//Likes
router.put('/likes/:postId',verifyStatus, likesPost);

export default router;