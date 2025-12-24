import axios from "axios";
export const renderProfilePage = async (req, res) => {
  const userId = res.locals.user ? res.locals.user._id : null;  
  const bookings = await fetchBookings(userId);
  const type = req.query.type ? req.query.type : 'account';
  res.render('layouts/user', {
    bookings,
    type,  // Pass bookings to the template
    body: 'pages/profile',
  });
};

const fetchBookings = async (userId) => {
  try {
    const response = await axios.get(`https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/bookings/user/${userId}`, {
      withCredentials: true,
    });
    return response.data;  // Return the bookings data
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

