const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ownly_db",
  password: "Kirti2006gami.",
  port: 5432,
});

module.exports = pool;