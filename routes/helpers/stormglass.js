require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;

// Returns surf data from stormglass API based on input coordinates
async function getSurfData(beach) {
  const latitude = Number(beach.latitude);
  const longitude = Number(beach.longitude);
  console.log("getting surf data...");

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
  const report = data.hours.filter((status) => status.time.includes("T00"));

  for (let i = 0; i < report.length; i++) {
    const status = {
      swellHeight: report[i].swellHeight[0].value,
      waveHeight: report[i].waveHeight[0].value
    };
    weeklyReport.push(status);
  }

  return weeklyReport;
}

module.exports = { getSurfData };

