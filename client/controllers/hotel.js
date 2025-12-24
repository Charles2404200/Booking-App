import axios from "axios";

export const renderHotelPage = async (req, res) => {
  const error = req.query.error || null; 
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);  // Ensure month is two digits
    const day = ('0' + d.getDate()).slice(-2);  // Ensure day is two digits
    return `${year}/${month}/${day}`;
  };

  const query = {
    location: req.query.location || '',
    startDate: req.query.startDate ? req.query.startDate : formatDate(new Date()),  // Set to today if null
    endDate: req.query.endDate ? req.query.endDate : formatDate(new Date(new Date().setDate(new Date().getDate() + 1))),  // Set to tomorrow if null
    adults: req.query.adults ? parseInt(req.query.adults) : 1,  // Default to 1 adult if not provided
    children: req.query.children ? parseInt(req.query.children) : 0,  // Default to 0 children
    rooms: req.query.rooms ? parseInt(req.query.rooms) : 1  // Default to 1 room
  };

  console.log(query);

  try {
    // Fetch cities and hotels
    const cities = await fetchCities();
    await updateCityImages(cities);

    const hotels = await fetchHotels();
    const randomHotels = selectRandomHotels(hotels); // Pass hotels to the function
    const searchHotels = await handleSearchHotels(query); // Await the result here
    const allTypes = await getAllTypes();
    const allFacilities = await getAllFacilities();
    // Render page with data
    res.render('layouts/main', {
      cities,
      randomHotels,
      hotels,
      error,
      searchHotels,
      allTypes,
      allFacilities,
      query,
      body: 'pages/hotel',
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    res.status(500).send('Server error');
  }
};

// Fetch cities based on unique hotel cities
async function fetchCities() {
  try {
    const res = await axios.get('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/hotels', { withCredentials: true });
    const hotels = res.data;

    const uniqueCities = {};

    hotels.forEach(hotel => {
      if (!uniqueCities[hotel.city]) {
        uniqueCities[hotel.city] = {
          name: hotel.city,
          img: '', 
          count: 1
        };
      } else {
        uniqueCities[hotel.city].count += 1;
      }
    });

    const cities = Object.values(uniqueCities);
    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
  }
}

// Fetch images for cities
async function getImg(city) {
  const defaultImg = '/images/default-city.png';

  try {
    const res = await axios.get(`https://api.unsplash.com/search/photos?query=${city.name}&client_id=${process.env.API_KEY}`);
    city.img = res.data.results[0]?.urls?.small || defaultImg; // Fallback to default image
    return city;
  } catch (error) {
    console.error('Error fetching image:', error);
    city.img = defaultImg;
    return city;
  }
}

// Update images for all cities
async function updateCityImages(cities) {
  for (let i = 0; i < cities.length; i++) {
    cities[i] = await getImg(cities[i]);
  }
}

// Fetch all hotels
async function fetchHotels() {
  try {
    const res = await axios.get('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/hotels', { withCredentials: true });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch hotel list:', error.message || error);
  }
}

// Select random hotels
function selectRandomHotels(hotels) {
  const randomIndexes = [];
  const randomHotels = [];

  if (hotels.length > 0) {
    while (randomIndexes.length < 3 && randomIndexes.length < hotels.length) {
      const randomIndex = Math.floor(Math.random() * hotels.length);
      if (!randomIndexes.includes(randomIndex)) {
        randomIndexes.push(randomIndex);
        randomHotels.push(hotels[randomIndex]);
      }
    }
  }

  return randomHotels;
}


const handleSearchHotels = async (query) => {
  
  try {
    const res = await axios.post('https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/hotels/search',query, {
      withCredentials: true,
    });
    const hotels = res.data;
    return hotels;
  } catch (error) {
    console.error("Error searching hotels", error);
  }
};
async function getAllTypes() {
  try {
    const hotels = await fetchHotels();
    if (!hotels || !Array.isArray(hotels)) {
      console.error('No hotels data found or invalid format');
      return [];
    }
    
    // Extract all unique types from hotels
    const types = [...new Set(hotels.map(hotel => hotel.type))];
    return types;
  } catch (error) {
    console.error('Failed to get all types:', error.message || error);
  }
}

// Function to get all unique facilities from the hotels
async function getAllFacilities() {
  try {
    const hotels = await fetchHotels();
    if (!hotels || !Array.isArray(hotels)) {
      console.error('No hotels data found or invalid format');
      return [];
    }

    // Extract all unique facilities from hotels
    const facilities = [...new Set(hotels.flatMap(hotel => hotel.facilities))];
    return facilities;
  } catch (error) {
    console.error('Failed to get all facilities:', error.message || error);
  }
}
