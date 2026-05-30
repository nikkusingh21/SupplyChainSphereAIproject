const asyncHandler = require("express-async-handler");
const Forecast = require("../models/Forecast");
const { runForecastPrediction } = require("../services/predictionService");

// ──────────────────────────────────────────────
// @desc    Get all forecasts (with filters)
// @route   GET /api/forecast
// @access  Private
// ──────────────────────────────────────────────
const getForecasts = asyncHandler(async (req, res) => {
  const { sku, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (sku) query.productSku = sku.toUpperCase();
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [forecasts, total] = await Promise.all([
    Forecast.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("generatedBy", "name email"),
    Forecast.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: forecasts,
  });
});

// ──────────────────────────────────────────────
// @desc    Get a single forecast by ID
// @route   GET /api/forecast/:id
// @access  Private
// ──────────────────────────────────────────────
const getForecastById = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findById(req.params.id).populate("generatedBy", "name email");
  if (!forecast) {
    res.status(404);
    throw new Error("Forecast not found.");
  }
  res.json({ success: true, data: forecast });
});

// ──────────────────────────────────────────────
// @desc    Generate a new AI forecast for a product
// @route   POST /api/forecast/generate
// @access  Private
// ──────────────────────────────────────────────
const generateForecast = asyncHandler(async (req, res) => {
  const { productSku, productName, startDate, endDate, granularity, modelUsed } = req.body;

  // Create a pending forecast record first
  const forecast = await Forecast.create({
    productSku,
    productName,
    forecastPeriod: { startDate, endDate, granularity: granularity || "monthly" },
    modelUsed: modelUsed || "Ensemble",
    status: "pending",
    generatedBy: req.user.id,
  });

  // Run prediction asynchronously via predictionService
  // This calls the Python AI service or runs a built-in model
  runForecastPrediction(forecast._id, { productSku, startDate, endDate, granularity, modelUsed })
    .then(() => {
      // Forecast is updated in place by predictionService
    })
    .catch((err) => {
      Forecast.findByIdAndUpdate(forecast._id, { status: "failed" }).exec();
    });

  res.status(202).json({
    success: true,
    message: "Forecast generation started. Check back shortly.",
    forecastId: forecast._id,
  });
});

// ──────────────────────────────────────────────
// @desc    Delete a forecast
// @route   DELETE /api/forecast/:id
// @access  Private (admin/manager)
// ──────────────────────────────────────────────
const deleteForecast = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findByIdAndDelete(req.params.id);
  if (!forecast) {
    res.status(404);
    throw new Error("Forecast not found.");
  }
  res.json({ success: true, message: "Forecast deleted." });
});

// ──────────────────────────────────────────────
// @desc    Get the latest forecast for a specific SKU
// @route   GET /api/forecast/latest/:sku
// @access  Private
// ──────────────────────────────────────────────
const getLatestForecastBySku = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findOne({
    productSku: req.params.sku.toUpperCase(),
    status: "completed",
  }).sort({ createdAt: -1 });

  if (!forecast) {
    res.status(404);
    throw new Error(`No completed forecast found for SKU: ${req.params.sku}`);
  }
  res.json({ success: true, data: forecast });
});

module.exports = {
  getForecasts,
  getForecastById,
  generateForecast,
  deleteForecast,
  getLatestForecastBySku,
};
