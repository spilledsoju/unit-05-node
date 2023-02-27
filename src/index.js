require("dotenv").config();
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const todoFilePath = process.env.BASE_JSON_PATH;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.raw());
app.use(bodyParser.json());

app.use("/content", express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => {
  /*
  res.sendFile("./public/index.html", { root: __dirname });
  */
  res.status(501).end();
});

app.get("/todos", (_, res) => {
  /*
  res.header("Content-Type","application/json");
  res.sendFile(todoFilePath, { root: __dirname });
  */
  res.status(501).end();
});

//Add GET request with path '/todos/overdue'

//Add GET request with path '/todos/completed'

//Add POST request with path '/todos'

//Add PATCH request with path '/todos/:id

//Add POST request with path '/todos/:id/complete

//Add POST request with path '/todos/:id/undo

//Add DELETE request with path '/todos/:id

module.exports = app;
