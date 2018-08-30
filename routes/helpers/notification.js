const twilio  = require('twilio');
const twilioNumber = process.env.TWILIO_NUMBER;
const accountSid   = process.env.TWILIO_SID;
const authToken    = process.env.TWILIO_AUTH_TOKEN;
const client       = new twilio(accountSid, authToken);

const mailgunKey    = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({ apiKey: mailgunKey, domain: mailgunDomain });

function sendSMS(data, timestamp) {
  const date = new Date(timestamp).toDateString();

  client.messages.create({
    body: `Great surfing conditions at ${data.name} on ${date}`,
    to: `${data.phone_number}`,
    from: `${twilioNumber}`
  })
  .then(message => console.log(message))
  .catch(error => console.error(error));
}

function sendEmail(data, timestamp) {
  const date = new Date(Number(timestamp)).toDateString();

  const email = {
    from: 'Admin <admin@surfbuddy.com>',
    to: `${data.email}`,
    subject: 'Surf Update',
    text: `Great surfing conditions at ${data.name} on ${date}`
  };

  mailgun.messages().send(email, (error, body) => {
    console.log(body);
  })
}

function prepareUserNotifications(knex) {
  knex("beaches")
    .join("favorites", "beaches.id", "favorites.beach_id")
    .join("users", "users.id", "favorites.user_id")
    .select("name", "stormglass", "email", "phone_number")
    .then((results) => {
      results.forEach((result) => {
        const { stormglass } = result;

        // Send one email if conditions are good on one of the forecast days per beach
        for (let i = 0; i < stormglass.length; i++) {
          let dailyReport = stormglass[i];
          let timestamp = Object.keys(dailyReport)[0];

          if (dailyReport[timestamp].surfRating >= 4) {
            notificationSent = true;
            sendEmail(result, timestamp);
            // sendSMS(result, timestamp);
            break;
          }
        }
      });
    })
    .catch(error => console.error(error));
}

module.exports = { prepareUserNotifications };
