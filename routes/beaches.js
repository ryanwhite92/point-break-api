"use strict";

const express = require('express');
const router  = express.Router();

module.exports = (knex) => {

  router.get("/", (req, res) => {
    knex
      .select("*")
      .from("beaches")
      .then((results) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.json(results);
    });
  });

  return router;
}
