const twilio = require('twilio');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_NUMBER

function sendSMS(userNumber, beach) {
  client.messages.create({
    body: `Great surfing conditions at ${beach}`,
    to: `${userNumber}`,
    from: `${twilioNumber}`
  })
  .then(message => console.log(message))
  .catch(error => console.error(error));
}

module.exports = { sendSMS };
