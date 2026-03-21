const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ownly_db",
  password: "YOUR_REAL_POSTGRES_PASSWORD",
  port: 5432,
});

module.exports = pool;