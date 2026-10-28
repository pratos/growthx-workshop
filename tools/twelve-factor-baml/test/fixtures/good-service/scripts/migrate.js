// Applies migrations/*.sql to DATABASE_URL. This fixture only lists them.
const { readdirSync } = require("node:fs");
for (const file of readdirSync(`${__dirname}/../migrations`)) console.log(`applied ${file}`);
