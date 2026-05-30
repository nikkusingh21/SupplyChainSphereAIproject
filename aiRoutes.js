const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(protect);

router.get("/status", aiController.getAiStatus);
router.post("/optimize", aiController.optimizeInventory);
router.post("/cluster", aiController.clusterProduct);
router.post("/predict", aiController.predictDemand);
router.post("/search", aiController.searchAiCommand);

module.exports = router;
