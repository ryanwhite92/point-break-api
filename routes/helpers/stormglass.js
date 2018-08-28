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
    const windSpeed = report.windSpeed.length > 0 ? report.windSpeed[0].value : 'no data';
    const windDirection = report.windDirection.length > 0 ? report.windDirection[0].value : 'no data';

    const status = {
      weekday,
      waveHeight,
      swellHeight,
      wavePeriod,
      windSpeed,
      windDirection
    };

    console.log(status);
    weeklyReport.push(status);
  });

  return weeklyReport;
}

module.exports = { getSurfData };
