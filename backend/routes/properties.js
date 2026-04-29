const express = require("express");
const router = express.Router();
const { addProperty, getAllProperties, getPropertyById, deleteProperty } = require("../controllers/propertyController");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

router.post("/add", authMiddleware, requireAdmin, addProperty);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.delete("/:id", authMiddleware, requireAdmin, deleteProperty);

module.exports = router;