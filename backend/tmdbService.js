const axios = require('axios');
const apiKey = process.env.TMDB_API_KEY;

async function fetchMovieData(movieId) {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching movie data:", error);
    return null;
  }
}

module.exports = { fetchMovieData };
