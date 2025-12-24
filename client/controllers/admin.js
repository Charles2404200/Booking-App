import axios from 'axios';

export const renderAdminPage = async (req, res) => {
    const token = req.cookies.access_token;
    try {
        const rows = await handleRows(token); // Await the result of handleRows
        const rowspost = await handleRowsPost(token);
        res.render('layouts/admin', {
            rows, 
            rowspost,
            body: 'pages/admin'
        });
    } catch (error) {
        console.error('Error rendering admin page:', error);
        res.status(500).send('Server error');
    }
};

const handleRows = async (token) => {
    try {
        const response = await axios.get('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/users', {
            headers: {
                'Cookie': `access_token=${token}`, // Manually set the cookie
            },
            withCredentials: true,
           
        });

        const users = response.data;
        let rows = [];

        // Iterate over the array of users
        for (const user of users) {
            rows.push({ 
                id: user._id, 
                username: user.username, 
                googleId: user.googleId,
                fname: user.fname,
                lname: user.lname,
                email: user.email, 
           
                date: user.date,
                country: user.country,
                img: user.img,
                city: user.city,
                phone: user.phone,
                status: user.status,
                createdAt: user.createdAt,  // timestamps included in the schema
                updatedAt: user.updatedAt   // timestamps included in the schema
            });
        }

        return rows;
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error; // Propagate the error to be handled by the calling function
    }
};
const handleRowsPost = async (token) => {
    try {
        const response = await axios.get('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/posts', {
            headers: {
                'Cookie': `access_token=${token}`, // Manually set the cookie
            },
            withCredentials: true,
        });

        const posts = response.data;
        let rows = [];

        // Iterate over the array of posts
        for (const post of posts) {
            rows.push({ 
                id: post._id, 
                user: post.user, // This is an ObjectId, which might need population on the server side
                title: post.title, 
                text: post.text, 
                img: post.img, // Optional, might be undefined
                likes: post.likes, 
                likedBy: post.likedBy.length, // Number of users who liked the post
                comments: post.comments.length, // Number of comments on the post
                timestamp: post.timestamp, // Date of the post
            });
        }

        return rows;
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        throw error; // Propagate the error to be handled by the calling function
    }
};