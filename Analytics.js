const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "daily_summary",
        "weekly_summary",
        "monthly_summary",
        "route_performance",
        "supplier_scorecard",
        "risk_event",
      ],
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    kpis: {
      totalRevenue: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      fulfillmentRate: { type: Number, default: 0 }, // percentage
      onTimeDeliveryRate: { type: Number, default: 0 }, // percentage
      inventoryTurnover: { type: Number, default: 0 },
      wasteReductionPercent: { type: Number, default: 0 },
      avgDeliveryDays: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
    },
    topProducts: [
      {
        sku: String,
        name: String,
        unitsSold: Number,
        revenue: Number,
      },
    ],
    riskEvents: [
      {
        title: { type: String },
        severity: { type: String, enum: ["low", "medium", "high", "critical"] },
        affectedSku: { type: String },
        detectedAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
      },
    ],
    routeMetrics: [
      {
        routeId: String,
        origin: String,
        destination: String,
        avgTransitDays: Number,
        delayRate: Number, // percentage
        carrier: String,
      },
    ],
    generatedBy: {
      type: String,
      default: "system", // 'system' or a user ID
    },
  },
  {
    timestamps: true,
  }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);
module.exports = Analytics;
