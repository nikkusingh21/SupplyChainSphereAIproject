const express = require("express");
const router = express.Router();
const {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
} = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateInventoryItem } = require("../middleware/validateMiddleware");

// All inventory routes require authentication
router.use(protect);

router.get("/stats", getInventoryStats);
router.get("/", getInventory);
router.get("/:id", getInventoryById);
router.post("/", authorize("admin", "manager"), validateInventoryItem, createInventoryItem);
router.put("/:id", authorize("admin", "manager"), updateInventoryItem);
router.delete("/:id", authorize("admin"), deleteInventoryItem);

module.exports = router;
