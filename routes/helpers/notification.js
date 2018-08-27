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

module.exports = { sendSMS, sendEmail };
