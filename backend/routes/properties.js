const express = require("express");
const router = express.Router();
const { addProperty, getAllProperties, getPropertyById } = require("../controllers/propertyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, addProperty);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

module.exports = router;