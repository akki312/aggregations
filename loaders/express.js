const express = require("express");
const bodyParser = require("body-parser")
 const app = express();
 app.use(
    bodyParser.urlencoded({
      limit: "100mb",
      parameterLimit: 5000000,
      extended: true,
    })
  );
 module.exports = app;