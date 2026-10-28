// Follows the twelve factors: config from env, stdout logs, graceful shutdown.
const http = require("node:http");

const databaseUrl = process.env.DATABASE_URL;
const port = Number(process.env.PORT);

const server = http.createServer((req, res) => {
  console.log(JSON.stringify({ level: "info", method: req.method, path: req.url, db: Boolean(databaseUrl) }));
  res.end("ok");
});

server.listen(port);

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
