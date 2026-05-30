const express = require("express");
const router = express.Router();
const {
  getForecasts,
  getForecastById,
  generateForecast,
  deleteForecast,
  getLatestForecastBySku,
} = require("../controllers/forecastController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateGenerateForecast } = require("../middleware/validateMiddleware");

router.use(protect);

router.get("/", getForecasts);
router.get("/latest/:sku", getLatestForecastBySku);
router.get("/:id", getForecastById);
router.post("/generate", authorize("admin", "manager", "analyst"), validateGenerateForecast, generateForecast);
router.delete("/:id", authorize("admin", "manager"), deleteForecast);

module.exports = router;
