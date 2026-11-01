require("dotenv").config();
const express = require("express");
const path = require("path");
const pool = require("./src/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion");
    res.json({ status: "ok", database: rows[0].databaseName, mysqlVersion: rows[0].mysqlVersion });
  } catch (error) { next(error); }
});

app.use("/api", require("./src/routes/api"));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: "A record with the same unique value already exists." });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ error: "A referenced record does not exist. Check the selected department, section, course or enrollment." });
  }
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({ error: "This record is being used by another record. Remove or reassign dependent records first." });
  }
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => console.log(`Student Management System running at http://localhost:${PORT}`));
