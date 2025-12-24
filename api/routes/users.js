import express from 'express';
const router = express.Router();
import { verifyUser, verifyAdmin, verifyToken, verifyStatus } from '../utils/verifyToken.js';
import { updateUser, deleteUser, getUser,  getUsers, getUserByName, createUser } from '../controllers/user.js';

// Update user
router.put("/:userId",verifyStatus, updateUser);

// Delete user
router.delete("/:userId", verifyAdmin, deleteUser);

// Get single user
router.get("/:id", getUser);
// Get all users (only accessible by admin)
router.get("/",verifyAdmin,getUsers);
router.get("/name/:username", getUserByName)

//Admin create user

router.post("/admin",verifyAdmin,createUser);

export default router;  