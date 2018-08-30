require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;
const darkskyApiKey = process.env.DARKSKY_KEY;

// Returns surf data from stormglass API based on input coordinates
async function getSurfData(beach) {
  const { latitude, longitude } = beach;
  const params = 'waveHeight,swellHeight,wavePeriod,windSpeed,windDirection';
  // Set start date to previous day
  let start = new Date();
  start = Math.floor(start.setDate(start.getDate() - 1) / 1000);

  const response = await fetch(`https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}&params=${params}&start=${start}`, {
    headers: {
      'Authorization': sgApiKey
    }
  });
  const json = await response.json();

  return json;
}

// Returns weather data from darksky API based on input coordinates
async function getWeatherData(beach) {
  const { latitude, longitude } = beach;
  const exclude = 'minutely,hourly,alerts,flags';

  const darksky = await fetch(`https://api.darksky.net/forecast/${darkskyApiKey}/${latitude},${longitude}?exclude=${exclude}&units=ca`);
  const forecast = await darksky.json();
  const dailyForecast = forecast.daily.data;

  return dailyForecast;
}

function calcSurfRating(dailyReport) {
  const { waveHeight, swellHeight, wavePeriod, windSpeed, windDirection } = dailyReport;
  let surfRating = 0;

  if (waveHeight && waveHeight >= 1 && waveHeight <= 3) surfRating++;
  if (swellHeight && swellHeight >= 0.5 && swellHeight <= 3) surfRating++;
  if (wavePeriod && wavePeriod >= 12) surfRating++;
  if (windSpeed && windSpeed <= 15) surfRating++;
  if (windDirection && windDirection >= 210 && windDirection <= 290) surfRating++;

  return surfRating;
}

// Builds weekly surf report based on first entry of each day, using the values from the
// first index of each array in params variable above
async function buildSurfReport(beach) {
  const weeklyReport = [];
  const weatherData = await getWeatherData(beach);
  const surfData = await getSurfData(beach);

  weatherData.forEach((dailyForecast) => {
    const dailyReport = {};
    const timestamp = dailyForecast.time * 1000;
    const weatherIcon = dailyForecast.icon;
    const windDirection = dailyForecast.windBearing;
    const windSpeed = dailyForecast.windSpeed;

    dailyReport[timestamp] = {
        weatherIcon,
        windDirection,
        windSpeed
    };

    surfData.hours.forEach((hour) => {
      const parsed = Date.parse(hour.time);

      if (dailyReport[parsed]) {
        dailyReport[parsed].waveHeight = hour.waveHeight[0].value;
        dailyReport[parsed].swellHeight = hour.swellHeight[0].value;
        dailyReport[parsed].wavePeriod = hour.wavePeriod[0].value;
      }
    });

    dailyReport[timestamp].surfRating = calcSurfRating(dailyReport[timestamp]);

    console.log(dailyReport);
    weeklyReport.push(dailyReport);
  });

  console.log(weeklyReport)
  return weeklyReport;
}

function updateSurfData(knex) {

  function updateDatabase(result, data) {
    knex("beaches")
      .where({ id: result.id })
      .update({
        stormglass: data,
        updated_at: new Date()
      })
      .catch(error => console.error(error));
  }

  knex("beaches")
    .select("*")
    .then((results) => {
      results.forEach((result) => {
        buildSurfReport(result)
          .then((data) => {
            data = JSON.stringify(data);

            updateDatabase(result, data);

          })
          .catch(error => console.error(error));
      });
    })
    .catch(error => console.error(error));
}

module.exports = { updateSurfData };
