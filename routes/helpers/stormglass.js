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

  return json;
}

module.exports = { getSurfData };

