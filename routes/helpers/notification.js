const twilio  = require('twilio');
const twilioNumber = process.env.TWILIO_NUMBER;
const accountSid   = process.env.TWILIO_SID;
const authToken    = process.env.TWILIO_AUTH_TOKEN;
const client       = new twilio(accountSid, authToken);

const mailgunKey    = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({ apiKey: mailgunKey, domain: mailgunDomain });

function sendSMS(userNumber, beach) {
  client.messages.create({
    body: `Great surfing conditions at ${beach}`,
    to: `${userNumber}`,
    from: `${twilioNumber}`
  })
  .then(message => console.log(message))
  .catch(error => console.error(error));
}

function sendEmail(userEmail, beach) {
  const data = {
    from: 'Admin <admin@surfbuddy.com>',
    to: `${userEmail}`,
    subject: 'Surf Update',
    text: `Great surfing conditions at ${beach}`
  };

  mailgun.messages().send(data, (error, body) => {
    console.log(body);
  })
}

function prepareUserNotifications(knex) {
  knex("beaches")
    .join("favorites", "beaches.id", "favorites.beach_id")
    .join("users", "users.id", "favorites.user_id")
    .select()
    .then((results) => {
      console.log(results);
      results.forEach((result) => {
        const { email, name, stormglass } = result;

        // For now only sends one email if conditions are good on one of the forecast days
        // per beach
        for (let i = 0; i < stormglass.length; i++) {
          let dailyReport = stormglass[i];
          let notificationSent = false;

          for (let key of Object.keys(dailyReport)) {
            if (dailyReport[key].surfRating >= 4) {
              notificationSent = true;
              sendEmail(email, name);
              // sendSMS('+1(yourPhoneNumber)', 'Sombrio Beach');
            }
          }

          if (notificationSent) break;
        }
      });
    })
    .catch(error => console.error(error));
}

module.exports = { prepareUserNotifications };
