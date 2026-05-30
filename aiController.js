const axios = require("axios");
const { PREDICTION_MODEL_URL } = require("../config/dotenv");
const logger = require("../utils/logger");

// Get base URL for python API (removing /predict if it exists)
const getBaseUrl = () => {
  if (!PREDICTION_MODEL_URL) return "http://localhost:8000";
  return PREDICTION_MODEL_URL.replace("/predict", "");
};

exports.getAiStatus = async (req, res, next) => {
  try {
    const response = await axios.get(`${getBaseUrl()}/status`, { timeout: 5000 });
    res.status(200).json(response.data);
  } catch (error) {
    logger.warn("AI Server status check failed (it may be offline).");
    res.status(200).json({
      success: true,
      model_trained: false,
      clustering_active: false,
      inventory_optimizer_running: false,
      api_connected: false,
      error: error.message
    });
  }
};

exports.optimizeInventory = async (req, res, next) => {
  try {
    const { items } = req.body;
    const response = await axios.post(`${getBaseUrl()}/optimize`, { items }, { timeout: 15000 });
    res.status(200).json(response.data);
  } catch (error) {
    logger.error("Failed to generate AI optimizations:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate optimizations." });
  }
};

exports.clusterProduct = async (req, res, next) => {
  try {
    const { product_name, category, base_price } = req.body;
    const response = await axios.post(`${getBaseUrl()}/cluster`, { product_name, category, base_price }, { timeout: 15000 });
    res.status(200).json(response.data);
  } catch (error) {
    logger.error("Failed to cluster product:", error.message);
    res.status(500).json({ success: false, message: "Failed to cluster product." });
  }
};

exports.predictDemand = async (req, res, next) => {
  try {
    // This connects directly to the /predict endpoint for the "Predict Demand" button
    const { sku, start_date, end_date, granularity } = req.body;
    const response = await axios.post(`${getBaseUrl()}/predict`, { 
      sku, start_date, end_date, granularity 
    }, { timeout: 30000 });
    res.status(200).json(response.data);
  } catch (error) {
    logger.error("Failed to predict demand:", error.message);
    res.status(500).json({ success: false, message: "Failed to predict demand." });
  }
};

exports.searchAiCommand = async (req, res, next) => {
  try {
    const { query } = req.body;
    const response = await axios.post(`${getBaseUrl()}/search`, { query }, { timeout: 15000 });
    res.status(200).json(response.data);
  } catch (error) {
    logger.error("Failed to execute AI search command:", error.message);
    res.status(500).json({ success: false, message: "Failed to execute AI search command." });
  }
};
