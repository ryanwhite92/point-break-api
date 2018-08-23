const sgApiKey = process.env.SG_KEY

// Returns surf data from stormglass API based on input coordinates
function getSurfData(latitide, longitude) {
  const stormglassUrl = `https://api.stormglass.io/point?lat=${latitude}&lng=${longitude}`;

  fetch(stormglassUrl, {
    headers: {
      'Authorization': sgApiKey
    }
  }).then((res) => {
    return JSON.parse(res);
  })
}

module.exports = getSurfData;
