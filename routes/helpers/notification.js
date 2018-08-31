const twilio  = require('twilio');
const twilioNumber = process.env.TWILIO_NUMBER;
const accountSid   = process.env.TWILIO_SID;
const authToken    = process.env.TWILIO_AUTH_TOKEN;
const client       = new twilio(accountSid, authToken);

const mailgunKey    = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({ apiKey: mailgunKey, domain: mailgunDomain });

function sendSMS(phoneNumber, data) {
  client.messages.create({
    body: `Great surfing conditions at:\n${data.join('\n')}`,
    to: `${phoneNumber}`,
    from: `${twilioNumber}`
  })
  .then(message => console.log(message))
  .catch(error => console.error(error));
}

function sendEmail(email, data) {
  const message = {
    from: 'Admin <admin@surfbuddy.com>',
    to: `${email}`,
    subject: 'Surf Update',
    text: `Great surfing conditions at:\n${data.join('\n')}`
  };

  mailgun.messages().send(message, (error, body) => {
    console.log(body);
  })
}

function groupUsers(data) {
  return data.reduce((obj, result) => {
    const { name, stormglass } = result;

    if (!(result.email in obj)) {
      obj[result.email] = {
        phoneNumber: result.phone_number,
        beachData: []
      };
    }

    obj[result.email].beachData.push({ name, stormglass });
    return obj;
  }, {});
}

// Return list of notifications based on the daily surf report at noon
// (change to user defined time -- stretch)
function filterAndCheckSurfReport(data) {
  const notificationList = [];

  for (let key of Object.keys(data)) {
    if (!(key in notificationList)) {
      notificationList[key] = {
        phoneNumber: data[key].phoneNumber,
        beachData: []
      };
    }

    data[key].beachData.forEach((datum) => {
      const filteredForecast = datum.stormglass.filter((forecast) => {
        const timestamp = Object.keys(forecast)[0];
        return new Date(Number(timestamp)).getHours() === 12;
      });

      filteredForecast.forEach((day) => {
        const dayKey = Object.keys(day)[0];
        if (day[dayKey].surfRating >= 4) {
          const date = new Date(Number(dayKey));
          notificationList[key].beachData.push({ date, beach: datum.name });
        }
      });

    });
  }

  return notificationList;
}

function sendNotifications(list) {
  for (let email in list) {
    const favoriteBeaches = [];
    const { phoneNumber, beachData } = list[email];

    beachData.forEach((n) => {
      let { date } = n;
      date = date.toDateString();
      const beachAndDate = `${n.beach} on ${date}`;
      favoriteBeaches.push(beachAndDate);
    });
    sendEmail(email, favoriteBeaches);
    // sendSMS(phoneNumber, favoriteBeaches);
  }
}

function groupUserNotifications(knex) {
  knex("beaches")
    .join("favorites", "beaches.id", "favorites.beach_id")
    .join("users", "users.id", "favorites.user_id")
    .select("name", "stormglass", "email", "phone_number")
    .then((results) => {
      return groupUsers(results);
    })
    .then((userData) => {
      const notifications = filterAndCheckSurfReport(userData);
      sendNotifications(notifications);
    })
    .catch(error => console.error(error));
}

module.exports = { groupUserNotifications };
