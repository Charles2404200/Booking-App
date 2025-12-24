import axios from "axios";

export const renderBookingPage = async (req, res) => {
    const query = req.query ? req.query : '';
   query.location = query.hotelId;
    console.log(query);
    try {
      // Fetch cities and hotels
      const response = await axios.post(`https://group-project-cosc3060-cosc3061-2024b-g2-ylkb.onrender.com/api/hotels/search`,query,{withCredentials:true});
        const hotel = response.data[0];
        const cities = await fetchCities();
        const hotels =await fetchHotels();
        await updateCityImages(cities);      // Render page with data
      res.render('layouts/main', {
        hotel,
        cities,
        hotels,
        query,
        body: 'pages/booking',
      });
    } catch (error) {
      console.error('Error rendering booking page:', error);
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
  