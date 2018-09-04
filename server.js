"use strict";

// require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const CronJob = require('cron').CronJob;

app.use(cookieSession({
  name: 'session',
  keys: 'osifwoviodans',
  signed: false
}));

// Loads the surfReport and notification helpers
const surfReport = require('./routes/helpers/surfReport');
const notification = require('./routes/helpers/notification');

// Separated Routes for each Resource
const usersRoutes = require("./routes/users");
const beachRoutes = require("./routes/beaches");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // handle json data
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static(require('path').join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Origin", "https://point-break-lhl.herokuapp.com");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));
app.use("/api/beaches", beachRoutes(knex));

// Update surf data every day at 23:55 PST
new CronJob('00 55 23 * * *', () => {
  console.log('Updating surf data...');
  surfReport.updateSurfData(knex);
}, null, true, 'America/Los_Angeles');

// Send daily notifications at 8am PST
new CronJob('00 15 08 * * *', () => {
  console.log('Sending daily notifications...');
  notification.groupUserNotifications(knex);
}, null, true, 'America/Los_Angeles');

// Home page
app.get("/", (req, res) => {
  console.log(req.session);
  res.send("POINT BREAK RESTful API");
});

app.post("/register", (req, res) => {
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const email = req.body.email.toLowerCase();
  const phoneNum = req.body.phone_number;
  const password = req.body.password;
  const hashedPW = bcrypt.hashSync(password, 10);
  const notification = req.body.notification_type;
  const favBeaches = req.body.favBeaches
  //check if email is registered
  knex.select('*').from('users').then((results) => {
    const stringified = JSON.stringify(results);
    const users = JSON.parse(stringified);
    for (const user of users) {
      if (user.email === email) {
        res.send("Already registered")
        return;
      }
    }
    //create user if all forms are filled
    if (firstName && lastName && email && phoneNum && password) {
      knex('users').insert({first_name: firstName, last_name: lastName, email: email, phone_number: phoneNum, password: hashedPW, notification_type: notification}).returning('*').then((results) => {
      console.log(results)
      const stringified = JSON.stringify(results)
      const user = JSON.parse(stringified)
      const userId = user[0].id;
      req.session.user_id = userId;
      console.log("Session set:", req.session.user_id)
      req.session.save((err) => {
        if (!err) {
          console.log("Saved:", req.session.user_id);
        }
      })
      if (favBeaches) {
        favBeaches.forEach((beach) => {
          knex('beaches').select('id').where({name: beach}).first().then((id) => {
            const stringifiedId = JSON.stringify(id)
            const beachId = JSON.parse(stringifiedId).id
            knex('favorites').insert({user_id: userId, beach_id: beachId}).then(() => {
              console.log("Added a fav beach.")
            })
          })
        })
      }
      res.send(results);
      })
    } else {
      res.send("Fill out all the forms!")
    }
  })
});

app.get("/user/:id", (req, res) => {
  let userId = req.params.id;
  if (userId == req.session.user_id) {
    knex.select('name', 'beaches.id').from('beaches').innerJoin('favorites','beach_id', 'beaches.id')
    .innerJoin('users', 'user_id', 'users.id').where({user_id: userId})
    .then((results) => {
      res.json(results)
    }).catch((err) => console.log(err))
  } else {
    res.send("Not authorized")
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;
  knex('users').select('*').where({email: email}).returning('password').then((results) => {
    const stringified = JSON.stringify(results);
    const userInfo = JSON.parse(stringified);
    if (bcrypt.compareSync(password, userInfo[0].password)) {
      req.session.user_id = userInfo[0].id;
      console.log('Session', req.session)
      res.send(userInfo)
      return;
    } else {
      res.send("Wrong password")
    }
  }).catch((err) => {
    res.send("Email not registered");
  })
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  req.session = null;
  res.send("Logged out")
});

app.post("/beach/delete", (req, res) => {
  console.log("Req body", req.body)
  knex('favorites').where({beach_id: req.body.id, user_id: req.body.userId}).del().then((result) => {
    console.log("Results: ", result)
    res.sendStatus(200)
  })
});

app.post("/beach/add", (req, res) => {
  const favBeaches = req.body.favBeaches
  const userId = req.body.userId
  if (favBeaches) {
    favBeaches.forEach((beach) => {
      knex('beaches').select('id').where({name: beach}).first().then((id) => {
        const stringifiedId = JSON.stringify(id)
        const beachId = JSON.parse(stringifiedId).id
        knex('favorites').insert({user_id: userId, beach_id: beachId}).then(() => {
          res.send("Added a new beach")
          console.log("Added a fav beach.")
        })
      })
    })
  }
});

app.get("/api/user/beaches", (req, res) => {
  knex('beaches').select('name').then((beachNames) => {
    const beaches = JSON.parse(JSON.stringify(beachNames))
    const b = [];
    beaches.forEach((beach) => {
      b.push(beach.name)
    })
    knex.select('name').from('beaches').innerJoin('favorites','beach_id', 'beaches.id')
    .innerJoin('users', 'user_id', 'users.id').where({user_id: req.session.user_id})
    .then((results) => {
      const favBeaches = JSON.parse(JSON.stringify(results));
      const fb = [];
      favBeaches.forEach((beach) => {
        fb.push(beach.name)
      })
      const filteredBeaches = b.filter((beach) => !fb.includes(beach));
      res.send(filteredBeaches);
    })
  })
});

app.post("/api/user/notifications", (req, res) => {
  if (req.body.setting === 'off') {
    knex('users').update({ notifications: false }).where({id: req.session.user_id}).then((result) => {
      res.send("Updated setting")
    })
  } else if (req.body.setting === 'on') {
    knex('users').update({ notifications: true }).where({id: req.session.user_id}).then((result) => {
      res.send("Updated setting")
    })
  }
});

app.post("/api/user/notificationtype", (req, res) => {
  if (req.body.setting === 'email') {
    knex('users').update({ notification_type: 'email' }).where({id: req.session.user_id}).then((result) => {
      res.send("Updated notification type")
    })
  } else if (req.body.setting === 'text') {
    knex('users').update({ notification_type: 'text' }).where({id: req.session.user_id}).then((result) => {
      res.send("Updated notification type")
    })
  }
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
  console.log("Updating surf data...");
  // Uncomment to update database
  surfReport.updateSurfData(knex);
  notification.groupUserNotifications(knex);
});


