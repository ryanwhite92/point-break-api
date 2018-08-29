require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;
const darkskyApiKey = process.env.DARKSKY_KEY;

// Returns surf data from stormglass API based on input coordinates
async function getSurfData(beach) {
  const latitude = Number(beach.latitude);
  const longitude = Number(beach.longitude);
  const params = 'waveHeight,swellHeight,wavePeriod,windSpeed,windDirection';
  let range = new Date();
  range.setDate(range.getDate() + 4);
  const end = Date.parse(range) / 1000;

  const response = await fetch(`https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}&params=${params}&end=${end}`, {
    headers: {
      'Authorization': sgApiKey
    }
  });
  const json = await response.json();
  const data = buildSurfReport(json);

  return data;
}

async function getWeatherData() {
  const latitude = 48.4206;
  const longitude = -124.0557;
  const exclude = 'minutely,hourly,alerts,flags';

  const darksky = await fetch(`https://api.darksky.net/forecast/${darkskyApiKey}/${latitude},${longitude}?exclude=${exclude}`);
  const forecast = await darksky.json();
  const dailyForecast = forecast.daily.data;

  console.log(dailyForecast);
  return dailyForecast;
}

// Builds weekly surf report based on first entry of each day, using the values from the
// first index of each array in params variable above
async function buildSurfReport() {
  const weeklyReport = [];
  // const reports = data.hours.filter((status) => status.time.includes("T00"));
  // const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // const surfData = await getSurfData(beach);
  const weatherData = await getWeatherData();

  weatherData.forEach((dailyForecast) => {
    const dailyReport = {};
    const timestamp = dailyForecast.time;
    const weatherIcon = dailyForecast.icon;
    const windDirection = dailyForecast.windBearing;
    const windSpeed = dailyForecast.windSpeed;

    dailyReport[timestamp] = {
        weatherIcon,
        windDirection,
        windSpeed
    };

    weeklyReport.push(dailyReport);
  });

  console.log(weeklyReport)
  return weeklyReport;
}

function calcSurfRating(beach) {
  const { waveHeight, swellHeight, wavePeriod, windSpeed, windDirection } = beach;
  let surfRating = 0;

  if (waveHeight >= 1 && waveHeight <= 3) surfRating++;
  if (swellHeight >= 0.5 && swellHeight <= 3) surfRating++;
  if (wavePeriod >= 12) surfRating++;
  if (windSpeed !== '--' && windSpeed <= 20) surfRating++;
  if (windDirection !== '--' && windDirection >= 210 && windDirection <= 290) surfRating++;

  return surfRating;
}

module.exports = { getSurfData, getWeatherData, buildSurfReport };
