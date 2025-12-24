import Comment from "../models/Comment.js";
import Hotel from "../models/Hotel.js";
import Post from '../models/Post.js'; // Import the Post model

const populateReplies = async (comment, depth) => {
  if (depth === 0) return comment;

  comment = await Comment.populate(comment, {
    path: 'replies',
    populate: {
      path: 'user',
      select: 'username img'
    }
  });

  for (let reply of comment.replies) {
    await populateReplies(reply, depth - 1);
  }

  return comment;
};

export const getCommentsByHotel = async (req, res) => {
  const { hotelId } = req.params;

  try {
    let comments = await Comment.find({ hotel: hotelId, parentComment: null })
      .populate('user', 'username img')
      .lean(); // Using lean to convert to plain JS objects

    for (let i = 0; i < comments.length; i++) {
      comments[i] = await populateReplies(comments[i], 3); // Adjust the depth as needed
    }

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createComment = async (req, res) => {
  const { postId, user, text } = req.body;

  try {
    // Create a new comment
    const newComment = new Comment({ user, text });
    const savedComment = await newComment.save();

    // Populate the user details in the comment
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('user', 'username img')
      .exec();

    // Add the comment to the corresponding post
    await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: savedComment._id } }, // Push the comment ID to the post's comments array
      { new: true }
    );
    console.log(populatedComment)
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const replyComment = async (req, res) => {
  const { user, text, parentComment } = req.body;

  try {
    // Find the parent comment
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    // Create the new comment as a reply
    const newComment = new Comment({ user, text, parentComment });
    const savedComment = await newComment.save();

    // Add the new comment's ID to the parent's replies array
    parent.replies.push(savedComment._id);
    await parent.save();

    // Populate the user field in the newly created comment
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('user', 'username img')
      .exec();

    // Send the populated comment as the response
    res.status(201).json(populatedComment);
  } catch (err) {
    // Handle any errors
    res.status(500).json({ error: err.message });
  }
};

export const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;
  try {
    const updatedComment = await Comment.findByIdAndUpdate(commentId, { text }, { new: true });
    if (!updatedComment) return res.status(404).json({ error: 'Comment not found' });

    res.status(200).json(updatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCommentAndReplies = async (commentId) => {
  const comment = await Comment.findById(commentId);

  if (comment) {
      // Recursively delete replies
      await Promise.all(comment.replies.map(replyId => deleteCommentAndReplies(replyId)));

      // Delete the comment itself
      await comment.remove();
  }
};

export const deleteComment = async (req, res) => {
const { commentId } = req.params;
try {
  // Recursively delete the comment and its replies
  await deleteCommentAndReplies(commentId);

  // Remove the comment reference from the Post model or from a parent comment's replies array
  const postUpdateResult = await Post.findOneAndUpdate(
    { comments: commentId },
    { $pull: { comments: commentId } }
  );

  if (!postUpdateResult) {
    // If the comment was not directly in the Post's comments array, remove it from its parent comment's replies array
    await Comment.findOneAndUpdate(
      { replies: commentId },
      { $pull: { replies: commentId } }
    );
  }

  res.status(200).json({ message: 'Comment and its replies deleted successfully' });
} catch (err) {
  res.status(500).json({ error: err.message });
}
};

export const likesComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    const userId = req.body.userId;

    if (comment.likedBy.includes(userId)) {
      comment.likes -= 1;
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
    } else {
      comment.likes += 1;
      comment.likedBy.push(userId);
    }

    await comment.save();

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCommentsbyUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const comments = await Comment.find({ user: userId });
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};