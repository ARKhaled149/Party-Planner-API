# Labforward-tasks
## The Interview tasks for Labforward

### Party Planner API

This project is a Node.js application designed to help users find the best date and location for hosting a party based on weather conditions. The application works in Germany and uses the Google Maps API for geocoding and the Bright Sky weather API for retrieving weather data. It analyzes weather conditions such as temperature, wind speed, sunshine, and precipitation to determine the most optimal day for a party.

---

### Code Description

1. **Geocoding Locations**:
   - The application uses the Google Maps API to convert location names into latitude and longitude coordinates.
   - This step ensures that the weather data can be fetched for specific geographic locations.

2. **Fetching Weather Data**:
   - The Bright Sky weather API is used to retrieve weather data for the given locations and date range.
   - The data includes temperature, wind speed, sunshine, and precipitation for each day.

3. **Calculating Daily Averages**:
   - The weather data is grouped by date, and daily averages for temperature and wind speed are calculated.
   - Total sunshine and precipitation are also aggregated for each day.

4. **Finding the Optimal Date**:
   - The application analyzes the daily weather data to find the best day for a party based on the following criteria:
     - Temperature between 20°C and 30°C.
     - Wind speed below 30 km/h.
     - No precipitation.
     - Maximum sunshine.
   - If multiple days meet the criteria, the day with the most sunshine is selected.

5. **Output**:
   - The application returns the most optimal date and location for the party.
   - If no suitable date is found, it informs the user that no optimal date is available.
   - Keep in mind that the API doesn't work more than 10 days ahead in the future
