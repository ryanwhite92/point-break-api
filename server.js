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

// Loads the stormglass api helper
const stormglass = require('./routes/helpers/stormglass');

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

function updateDatabase(result) {
  const updateInterval = 60 * 60 * 24 * 1000; // daily update interval in ms

    stormglass.getSurfData(result)
      .then((data) => {
        console.log("main data:", data);
        data = JSON.stringify(data);
        result.stormglass = data;
        result.updated_at = new Date;
        console.log("RESULT", result)

        knex("beaches")
          .where({id: result.id})
          .update({
            stormglass: data,
            updated_at: new Date()
          })
          .catch(error => console.error(error));

      })
      .catch(error => console.error(error));
}

// Home page
app.get("/", (req, res) => {
  const updateInterval = 60 * 60 * 24 * 1000; // daily update interval in ms
  let updated = false;
  const surfReport = [];

  knex("beaches")
    .select("*")
    .then((results) => {
      results.forEach((result) => {
        if (!result.updated_at || Date.now() - Date.parse(result.updated_at) > updateInterval) {
          updated = true;
          updateDatabase(result);
        }
      });

      // If data needs to be updated, set timeout to wait for database to update (temp solution)
      if(updated) {
        setTimeout(() => {
          knex("beaches")
            .select("*")
            .then((results) => {
              res.render("index", { surfReport: results });
            })
            .catch(error => console.error(error));
        }, 2000);
      } else {
        res.render("index", { surfReport: results });
      }
    })
    .catch((error) => console.error(error));
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
