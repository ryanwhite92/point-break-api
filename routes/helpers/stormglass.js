require('es6-promise').polyfill();
require('isomorphic-fetch');

const ENV         = process.env.ENV || "development";
const knexConfig  = require("../../knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const sgApiKey    = process.env.SG_KEY

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
  }).then(function(report) {
    console.log(report);
  }).catch((error) => console.error(error));
}

module.exports = { getSurfData };
