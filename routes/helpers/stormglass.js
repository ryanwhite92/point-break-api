require('es6-promise').polyfill();
require('isomorphic-fetch');

const sgApiKey = process.env.SG_KEY;

// Returns surf data from stormglass API based on input coordinates
function getSurfData(latitude, longitude) {
  console.log("getting surf data...");

  const params = 'swellHeight,waveHeight';
  let status;

  fetch(`https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}&params=${params}`, {
    headers: {
      'Authorization': sgApiKey
    }
  }).then(function(response) {
    return response.json();
  }).then(function(surfStatus) {
    console.log(surfStatus);
    return surfStatus;
  }).catch((error) => console.error(error));
}

module.exports = { getSurfData };
