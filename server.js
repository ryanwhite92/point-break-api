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
// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

app.use(cookieSession({
  name: 'session',
  keys: ['secret-string', 'key2'],
}));

// Home page
app.get("/", (req, res) => {
  res.render("index");
});



app.get("/register", (req,res) => {
    res.render("registration")
});


app.post("/register", (req, res) => {
  console.log(req.body);
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const email = req.body.email.toLowerCase();
  const phoneNum = req.body.phone
  const password = req.body.password
  const hashedPW = bcrypt.hashSync(password, 10);
  //check if email is registered
  knex.select('*').from('users').then((results) => {
    const stringified = JSON.stringify(results);
    const users = JSON.parse(stringified);
    for (const user of users) {
      if (user.email === email) {
        res.end("This email is already registered.")
        return;
      } 
    }
      //create user if all forms are filled
    if (firstName && lastName && email && phoneNum && password) {
      knex('users').insert({first_name: firstName, last_name: lastName, email: email, phone_number: phoneNum, password: hashedPW}).returning('id').then((id) => {
      console.log("Inserted id:", JSON.parse(id))
      req.session.user_id = id;
      res.redirect('/');
      })
    } else {
      res.send("Fill out all the forms!")
    }
  })

});
    


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
