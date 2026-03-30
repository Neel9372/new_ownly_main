const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const db = require("./db");

db.query("SELECT NOW()")
  .then(res => console.log("DB Connected:", res.rows))
  .catch(err => console.error("DB Error:", err));

// Routes
const authRoutes = require("./routes/authRoutes");
const kycRoutes = require("./routes/kyc");
const propertyRoutes = require("./routes/properties");

app.use("/properties", propertyRoutes);
app.use(authRoutes);
app.use("/kyc", kycRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "API working" });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});