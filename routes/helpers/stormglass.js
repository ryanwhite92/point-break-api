require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;

// Returns surf data from stormglass API based on input coordinates
async function getSurfData(beach) {
  const latitude = Number(beach.latitude);
  const longitude = Number(beach.longitude);
  const params = 'swellHeight,waveHeight';

  const response = await fetch(`https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}&params=${params}`, {
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
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  reports.forEach((report) => {
    const weekday = weekdays[new Date(report.time).getDay()];

    const status = {
      weekday,
      swellHeight: report.swellHeight[0].value,
      waveHeight: report.waveHeight[0].value
    };
    weeklyReport.push(status);
  });

  return weeklyReport;
}

module.exports = { getSurfData };
