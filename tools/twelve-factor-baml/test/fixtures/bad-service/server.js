// Breaks most of the twelve factors on purpose. The key below is fake.
const express = require("express");
const fs = require("fs");
const { Pool } = require("pg");

const STRIPE_KEY = "sk_live_FAKEFAKEFAKEFAKEFAKE1234";
const pool = new Pool({ connectionString: "postgres://admin:hunter2@db.prod.internal:5432/app" });
const sessions = new Map();
let requestCount = 0;

const app = express();

app.get("/", (req, res) => {
  requestCount++;
  fs.appendFileSync("app.log", `${new Date().toISOString()} GET /\n`);
  res.send("ok");
});

setInterval(() => sendDailyDigest(), 60 * 60 * 1000);

function sendDailyDigest() {
  return fetch("https://api.mailer-internal.example.com/send", { method: "POST" });
}

app.listen(3000);
