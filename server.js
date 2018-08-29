"use strict";

require('dotenv').config();

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
// const session = require('express-session')
// const cookieParser = require('cookie-parser');
// app.use(cookieParser());
// app.use(session({
//   resave: false,
//   saveUninitialized: true,
//   secret: 'sdlfjljrowuroweu',
//   cookie: { secure: false }
// }));

app.use(cookieSession({
  name: 'session',
  keys: 'osifwoviodans',
  signed: false
}));

// Loads the surfReport helper
const surfReport = require('./routes/helpers/surfReport');
const notification = require('./routes/helpers/notification');

// Seperated Routes for each Resource
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


// Mount all resource routes
app.use("/api/users", usersRoutes(knex));
app.use("/api/beaches", beachRoutes(knex));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Update surf data every at 7:59am before sending out notifications
new CronJob('00 59 07 * * *', () => {
  console.log('Updating surf data...');
  surfReport.updateSurfData(knex);
}, null, true, 'America/Los_Angeles');

// Send daily notifications at 8am PST
new CronJob('00 00 08 * * *', () => {
  console.log('Sending daily notifications...');
  notification.prepareUserNotifications(knex);
}, null, true, 'America/Los_Angeles');

// Home page
app.get("/", (req, res) => {
  console.log(req.session)
});

app.post("/register", (req, res) => {
  console.log("req.body:", req.body);
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const email = req.body.email.toLowerCase();
  const phoneNum = req.body.phone_number;
  const password = req.body.password;
  const hashedPW = bcrypt.hashSync(password, 10);
  const favBeaches = req.body.favBeaches
  //check if email is registered
  knex.select('*').from('users').then((results) => {
    //res.json(results);
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
      knex('users').insert({first_name: firstName, last_name: lastName, email: email, phone_number: phoneNum, password: hashedPW}).returning('*').then((results) => {
      console.log(results)
      const stringified = JSON.stringify(results)
      const user = JSON.parse(stringified)
      const userId = user[0].id;
      req.session.user_id = userId;
      console.log("Session set:", req.session.user_id)
      req.session.save((err) => {
        if (!err) {
          console.log("SAVED IT!", req.session.user_id);
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

app.get("/login", (req, res) => {

});

app.get("/api/user", (req, res) => {
  //res.send(req.session)
  console.log(req.session)
  knex('users').select('first_name', 'email').where({id: req.session.user_id}).then((results) => {
    res.send(results)
  })
});

app.post("/login", (req, res) => {
  console.log("body", req.body)
  const email = req.body.email.toLowerCase();
  const password = req.body.password;
  if (email) {
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
    })
  } else {
    res.send("No email");
  }

});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  req.session = null;
  res.send("Logged out")
  console.log("Session:", req.session)
});


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
  console.log("Updating surf data...");
  // Uncomment below to update database
  // surfReport.updateSurfData(knex);
  notification.prepareUserNotifications(knex);
});


