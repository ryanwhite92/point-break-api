require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;
const owmApiKey = process.env.OWM_KEY;

// Returns surf data from stormglass API based on input coordinates
async function getSurfData(beach) {
  const { latitude, longitude } = beach;
  const params = 'waveHeight,swellHeight,wavePeriod,windSpeed,windDirection';

  const response = await fetch(`https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}&params=${params}`, {
    headers: {
      'Authorization': sgApiKey
    }
  });
  const json = await response.json();

  return json;
}

// Returns weather data from open weather map API based on input coordinates
async function getWeatherData(beach) {
  const { latitude, longitude } = beach;

  const owm = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${owmApiKey}`);
  const forecast = await owm.json();
  const weatherData = forecast.list;

  return weatherData;
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

  weatherData.forEach((forecast) => {
    const threeHourForecast = {};
    const timestamp = forecast.dt * 1000;
    const weatherIcon = forecast.weather[0].icon;
    const windDirection = forecast.wind.deg;
    const windSpeed = forecast.wind.speed * 3.6;

    threeHourForecast[timestamp] = {
        weatherIcon,
        windDirection,
        windSpeed
    };

    surfData.hours.forEach((hour) => {
      const parsed = Date.parse(hour.time);

      if (threeHourForecast[parsed]) {
        threeHourForecast[parsed].waveHeight = hour.waveHeight[0].value;
        threeHourForecast[parsed].swellHeight = hour.swellHeight[0].value;
        threeHourForecast[parsed].wavePeriod = hour.wavePeriod[0].value;
      }
    });

    threeHourForecast[timestamp].surfRating = calcSurfRating(threeHourForecast[timestamp]);

    console.log(threeHourForecast);
    weeklyReport.push(threeHourForecast);
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
