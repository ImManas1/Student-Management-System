const mysql = require("mysql2/promise");

// Production: Aiven (or any provider) gives a MYSQL_URL connection string.
// Local dev: falls back to individual env vars.
const pool = process.env.MYSQL_URL
  ? mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: { rejectUnauthorized: true },
    })
  : mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "student_management",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

module.exports = pool;
