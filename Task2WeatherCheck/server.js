const express = require('express');
const { Client } = require('@googlemaps/google-maps-services-js');
const axios = require('axios');
require('dotenv').config(); // Load API keys from .env file

const app = express();
const PORT = 3000;

// Initialize Google Maps client
const client = new Client();

// Helper function to fetch weather data for a given location and date range
async function fetchWeatherData(lat, lon, from, to) {
  try {
    const response = await axios.get('https://api.brightsky.dev/weather', {
      params: {
        lat,
        lon,
        date: from,
        last_date: to,
      },
    });
    return response.data.weather;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('No weather data found for the given location and date range.');
    }
    throw new Error('Failed to fetch weather data.');
  }
}



// Helper function to group weather data by date and calculate daily averages
function calculateDailyAverages(weatherData) {
  const dailyData = {};

  // Group data by date
  weatherData.forEach((entry) => {
    const date = entry.timestamp.split('T')[0]; // Extract the date portion of the timestamp
    if (!dailyData[date]) {
      dailyData[date] = {
        temperature: 0,
        wind_speed: 0,
        sunshine: 0,
        precipitation: 0,
        count: 0,
      };
    }

    dailyData[date].temperature += entry.temperature || 0;
    dailyData[date].wind_speed += entry.wind_speed || 0;
    dailyData[date].sunshine += entry.sunshine || 0;
    dailyData[date].precipitation += entry.precipitation || 0;
    dailyData[date].count += 1;
  });

  // Calculate averages for each day
  const dailyAverages = Object.keys(dailyData).map((date) => {
    const data = dailyData[date];
    return {
      date,
      avg_temperature: data.temperature / data.count,
      avg_wind_speed: data.wind_speed / data.count,
      total_sunshine: data.sunshine,
      total_precipitation: data.precipitation,
    };
  });
  return dailyAverages;
}


// Helper function to find the optimal date from weather data
function findOptimalDate(trimmedLocation, weatherData) {
  let optimalDay = null;
  updatedWeatherData = calculateDailyAverages(weatherData);
  updatedWeatherData.forEach((day) => {
    const {date, avg_temperature, avg_wind_speed, total_sunshine, total_precipitation} = day;
    // Check if the day meets the optimal conditions
    if (
      avg_wind_speed < 30 &&
      avg_temperature > 20 && avg_temperature < 30 &&
      total_sunshine > 0 && // Sunshine should be maximal (non-zero)
      total_precipitation === 0 // Precipitation should be minimal (zero)
    ) {
      if (!optimalDay || total_sunshine > optimalDay.sunshine) {
        optimalDay = { date, total_sunshine };
      }
    }
  });
  return{location: trimmedLocation, optimalDay: optimalDay};
}

// Endpoint to handle geocoding and weather fetching
app.get('/party_plan', async (req, res) => {
  const { locations, from, to } = req.query;

  // Validate input parameters
  if (!locations || !from || !to) {
    return res.status(400).json({
      error: 'Please provide locations, from date, and to date.',
    });
  }

  try {
    const locationArray = locations.split(','); // Split comma-separated locations
    let mostOptimal = null;
    for (const location of locationArray) {
      const trimmedLocation = location.trim();

      // Step 1: Geocode the location using Google Maps API
      let lat, lng;
      try {
        const geocodeResponse = await client.geocode({
          params: {
            address: trimmedLocation,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        });
        // Extract latitude and longitude from the geocoding response
        lat = geocodeResponse.data.results[0].geometry.location.lat;
        lng = geocodeResponse.data.results[0].geometry.location.lng;
      } catch (error) {
        console.error(`Failed to geocode location: ${trimmedLocation}: ${error.message}`);
        return res.status(400).json({
            error: "Failed to geocode location: "+trimmedLocation +error.message,
          });
      }

      // Step 2: Fetch weather data for the location and date range
      let weatherData;
      try {
        weatherData = await fetchWeatherData(lat, lng, from, to);
      } catch (error) {
        console.error(`Failed to fetch weather data for location ${trimmedLocation} due to error: ${error.message}`);
        return res.status(400).json({
            error: "Failed to fetch weather data for location "+trimmedLocation+ " due to error: "+error.message,
          });
      }

      // Step 3: Find the optimal date for this location
        const locationOptimalDay = findOptimalDate(trimmedLocation, weatherData);
        if (locationOptimalDay.optimalDay) {
        // Update the most optimal location if this one is better
          if (!mostOptimal || locationOptimalDay.optimalDay.total_sunshine > mostOptimal.sunshine) {
              mostOptimal = {
                  date: locationOptimalDay.optimalDay.date,
                  location: trimmedLocation,
                  sunshine: locationOptimalDay.optimalDay.total_sunshine
              };
              console.log("New Most Optimal Found: "+JSON.stringify(locationOptimalDay));
          }
        }

    //End Of Loop  
    }    

    // If no optimal location is found, respond accordingly
    if (!mostOptimal) {
      return res.json({
        message: 'No optimal date and location found.',
      });
    }

    // Respond with the most optimal date and location
    res.json({
      date: mostOptimal.date,
      location: mostOptimal.location,
    });
  } catch (error) {
    console.error(`Failed to process the request: ${error.message}`);
    res.status(500).json({ error: 'Failed to process the request.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});