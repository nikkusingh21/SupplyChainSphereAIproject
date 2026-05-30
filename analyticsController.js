const asyncHandler = require("express-async-handler");
const Analytics = require("../models/Analytics");
const Inventory = require("../models/Inventory");
const Forecast = require("../models/Forecast");

// ──────────────────────────────────────────────
// @desc    Get overall platform dashboard KPIs
// @route   GET /api/analytics/dashboard
// @access  Private
// ──────────────────────────────────────────────
const getDashboardKpis = asyncHandler(async (req, res) => {
  const [totalInventoryItems, lowStockItems, outOfStockItems, totalForecasts] =
    await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ status: "low_stock" }),
      Inventory.countDocuments({ status: "out_of_stock" }),
      Forecast.countDocuments({ status: "completed" }),
    ]);

  // Aggregate total inventory value
  const valueAgg = await Inventory.aggregate([
    { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } } } },
  ]);
  const totalInventoryValue = valueAgg[0]?.totalValue ?? 0;

  // Latest accuracy from most recent forecast
  const latestForecast = await Forecast.findOne({ status: "completed" }).sort({ createdAt: -1 });
  const forecastAccuracy = latestForecast?.accuracy?.overallAccuracy
    ? (latestForecast.accuracy.overallAccuracy * 100).toFixed(1)
    : null;

  res.json({
    success: true,
    data: {
      totalInventoryItems,
      lowStockItems,
      outOfStockItems,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
      totalForecasts,
      forecastAccuracy,
    },
  });
});

// ──────────────────────────────────────────────
// @desc    Get all analytics reports
// @route   GET /api/analytics
// @access  Private
// ──────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;
  const query = {};
  if (type) query.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [reports, total] = await Promise.all([
    Analytics.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Analytics.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: reports,
  });
});

// ──────────────────────────────────────────────
// @desc    Get a single analytics report
// @route   GET /api/analytics/:id
// @access  Private
// ──────────────────────────────────────────────
const getAnalyticsById = asyncHandler(async (req, res) => {
  const report = await Analytics.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Analytics report not found.");
  }
  res.json({ success: true, data: report });
});

// ──────────────────────────────────────────────
// @desc    Get active risk events across the supply chain
// @route   GET /api/analytics/risks
// @access  Private
// ──────────────────────────────────────────────
const getRiskEvents = asyncHandler(async (req, res) => {
  const reports = await Analytics.find({ "riskEvents.0": { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(20);

  const allRisks = reports.flatMap((r) =>
    r.riskEvents.filter((e) => !e.resolved)
  );

  res.json({ success: true, total: allRisks.length, data: allRisks });
});

// ──────────────────────────────────────────────
// @desc    Get inventory status breakdown for charts
// @route   GET /api/analytics/inventory-breakdown
// @access  Private
// ──────────────────────────────────────────────
const getInventoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await Inventory.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  res.json({ success: true, data: breakdown });
});

module.exports = {
  getDashboardKpis,
  getAnalytics,
  getAnalyticsById,
  getRiskEvents,
  getInventoryBreakdown,
};
