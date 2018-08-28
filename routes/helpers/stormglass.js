require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;

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

// Builds weekly surf report based on first entry of each day, using the values from the
// first index of each array in params variable above
function buildSurfReport(data) {
  const weeklyReport = [];
  const reports = data.hours.filter((status) => status.time.includes("T00"));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  reports.forEach((report) => {
    const weekday = weekdays[new Date(report.time).getDay()];
    const waveHeight = report.waveHeight[0].value;
    const swellHeight = report.swellHeight[0].value;
    const wavePeriod = report.wavePeriod[0].value;
    const windDirection = report.windDirection.length > 0 ? report.windDirection[0].value: '--';

    // Convert windSpeed from m/s to km/h (w/ 2 decimal places)
    let windSpeed = report.windSpeed.length > 0 ? report.windSpeed[0].value : '--';
    if (windSpeed !== '--') windSpeed = Math.round(windSpeed * 3.6 * 100) / 100;

    const status = {
      weekday,
      waveHeight,
      swellHeight,
      wavePeriod,
      windSpeed,
      windDirection
    };

    status.surfRating = calcSurfRating(status);
    console.log(status);
    weeklyReport.push(status);
  });

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

module.exports = { getSurfData };
