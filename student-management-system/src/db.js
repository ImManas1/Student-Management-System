const mysql = require("mysql2/promise");

// Production: Aiven gives a MYSQL_URL like:
//   mysql://user:pass@host:port/db?ssl-mode=REQUIRED
// mysql2 does NOT understand "ssl-mode" in the URL — strip it and use the
// `ssl` option instead.
let pool;

if (process.env.MYSQL_URL) {
  // Remove ssl-mode param that mysql2 doesn't recognise
  const cleanUrl = process.env.MYSQL_URL.replace(/[?&]ssl-mode=[^&]*/gi, "");

  pool = mysql.createPool({
    uri: cleanUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "student_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = pool;
