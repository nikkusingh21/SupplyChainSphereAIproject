const express = require("express");
const router = express.Router();
const {
  getDashboardKpis,
  getAnalytics,
  getAnalyticsById,
  getRiskEvents,
  getInventoryBreakdown,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/dashboard", getDashboardKpis);
router.get("/risks", getRiskEvents);
router.get("/inventory-breakdown", getInventoryBreakdown);
router.get("/", getAnalytics);
router.get("/:id", getAnalyticsById);

module.exports = router;
