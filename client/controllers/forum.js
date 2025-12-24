import axios from "axios";
import path from 'path';

export const renderForumPage = async (req, res) => {
    try {
        const sort = req.query.sort || 'default'; 
        const userId = req.query.userId || ''; 
        const search = req.query.search || ''; 

        const posts = await fetchPosts(sort, userId, search);
        res.render('layouts/forum', {
            posts,
            countCommentsAndReplies,
            body: 'pages/forum'
        });
    } catch (error) {
        console.error('Error rendering forum page:', error);
        res.status(500).send('Server error');
    }
};

async function fetchPosts(sort, userId, search) {
    try {
        const response = await axios.get('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/posts/search', {
            params: {
                sort,
                userId,
                search
            },
            withCredentials: true // Ensure credentials are included
        });
        return response.data; // Return the data directly
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        throw error; // Propagate the error to be handled by the calling function
    }
}
function countCommentsAndReplies(comments) {
    let total = 0;

    comments.forEach(comment => {
        total += 1; // Count the comment itself

        if (comment.replies && Array.isArray(comment.replies)) {
            total += countCommentsAndReplies(comment.replies); // Recursively count nested replies
        }
    });

    return total;
}

