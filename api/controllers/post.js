import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

export const getPosts = async (req, res) => {
    try {
        const { userId } = req.body;

        // Get query based on userId
        const query = userId ? { user: userId } : {};

        const posts = await Post.find(query)
            .populate( 'user', 'username img')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'username img'
                }
            })
            .lean();

        // Recursively populate replies
        for (let post of posts) {
            post.comments = await populateReplies(post.comments);
        }

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
function getSortOption(sort) {
    switch (sort) {
        case 'latest':
            return { createdAt: -1 };
        case 'oldest':
            return { createdAt: 1 }; 
        default:
            return { createdAt: -1 }; 
    }
}
export async function handleSearch(req, res) {
    const { sort, userId, search } = req.query;
    try {
        // Initialize the query object
        let query = {};

     

        // Add user filtering if userId is provided
        if (userId) {
            query.user = userId;
        }

        // Add search filtering only if search term is provided (non-empty)
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search, 'i'); // Case-insensitive partial match
            query.$or = [
                { title: searchRegex },     // Search in the title
                { text: searchRegex }       // Search in the text content of the post
            ];        }

      

        // Determine the sorting option based on the sort parameter
        let sortOption = {};
        if (sort === 'latest') {
            sortOption = { timestamp: -1 }; // Newest first
        } else if (sort === 'oldest') {
            sortOption = { timestamp: 1 }; // Oldest first
        }

   

        // Fetch posts based on the constructed query and sort option
        const posts = await Post.find(query)
            .populate('user', 'username img')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name img'
                }
            })
            .sort(sortOption) // Apply sorting
            .lean();

    

        // Recursively populate replies
        for (let post of posts) {
            post.comments = await populateReplies(post.comments);
        }

        // Send response
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error in handleSearch:', error.message);
        res.status(500).json({ message: error.message });
    }
}

function getQueryOption(sort, userId) {
    if (sort === 'userPosts' && userId) {
        return { user: userId }; // Filter by userId if `userPosts` is selected
    }
    return {}; // Default query (no filtering by user)
}

async function populateReplies(comments) {
    for (let i = 0; i < comments.length; i++) {
        // Populate the replies field with the full comment objects, not just IDs
        comments[i] = await Comment.findById(comments[i]._id)
            .populate('user', 'username img')
            .populate({
                path: 'replies',
                populate: {
                    path: 'user',
                    select: 'username img'
                }
            })
            .lean(); 

        // Recursively populate replies if they exist
        if (comments[i].replies.length > 0) {
            comments[i].replies = await populateReplies(comments[i].replies);
        }
    }

    return comments;
}

// Get posts by user ID
export const getPostsByUserId = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate('user', 'name')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get posts by title
export const getPostsByTitle = async (req, res) => {
    try {
        const titleRegex = new RegExp(req.params.title, 'i'); // Case-insensitive partial match
        const posts = await Post.find({ title: titleRegex })
            .populate('user', 'name')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new post
export const createPost = async (req, res) => {
    const { title, text, user, img  } = req.body;

    try {
        const newPost = new Post({ title, text, user, img });
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a post
export const updatePost = async (req, res, next) => {
    const { postId } = req.params;
    const { title, text, img } = req.body;

    try {
        // Find the post by ID
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Update the post with new data
        post.title = title || post.title;
        post.text = text || post.text;
        post.img = img || post.img;

        // Save the updated post
        const updatedPost = await post.save();

        // Send back the updated post data
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Failed to update post. Please try again.' });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (post) {
            // First, delete all comments associated with this post
            for (const commentId of post.comments) {
                await deleteCommentAndReplies(commentId);
            }

            // Then remove the post itself
            await post.remove();

            res.status(200).json({ message: 'Post and associated comments deleted successfully' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const deleteCommentAndReplies = async (commentId) => {
    const comment = await Comment.findById(commentId);

    if (comment) {
        // Recursively delete replies
        for (const replyId of comment.replies) {
            await deleteCommentAndReplies(replyId);
        }

        // Delete the comment itself
        await comment.remove();
    }
};


export const likesPost = async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId); // Fetch the post by ID
      const userId = req.body.userId;
  
      if (post.likedBy.includes(userId)) {
        // If the user has already liked the post, remove the like
        post.likes -= 1;
        post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      } else {
        // If the user has not liked the post, add the like
        post.likes += 1;
        post.likedBy.push(userId);
      }
  
      await post.save(); // Save the updated post
  
      res.status(200).json(post); // Return the updated post as a response
    } catch (err) {
      res.status(500).json({ error: err.message }); // Handle errors
    }
  };