const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
  {
    productSku: {
      type: String,
      required: [true, "Product SKU is required"],
      uppercase: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    forecastPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      granularity: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "monthly",
      },
    },
    predictions: [
      {
        date: { type: Date, required: true },
        predictedDemand: { type: Number, required: true, min: 0 },
        lowerBound: { type: Number, default: 0 }, // Confidence interval lower
        upperBound: { type: Number, default: 0 }, // Confidence interval upper
        confidenceScore: { type: Number, min: 0, max: 1, default: 0.9 },
      },
    ],
    actualDemand: [
      {
        date: { type: Date },
        actualUnits: { type: Number, min: 0 },
      },
    ],
    modelUsed: {
      type: String,
      enum: ["ARIMA", "LSTM", "XGBoost", "Prophet", "Ensemble"],
      default: "Ensemble",
    },
    accuracy: {
      mape: { type: Number, default: null }, // Mean Absolute Percentage Error
      rmse: { type: Number, default: null }, // Root Mean Squared Error
      overallAccuracy: { type: Number, default: null }, // e.g., 0.94 for 94%
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Forecast = mongoose.model("Forecast", forecastSchema);
module.exports = Forecast;
