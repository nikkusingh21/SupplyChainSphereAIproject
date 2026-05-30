const asyncHandler = require("express-async-handler");
const Inventory = require("../models/Inventory");

// ──────────────────────────────────────────────
// @desc    Get all inventory items (with filtering & pagination)
// @route   GET /api/inventory
// @access  Private
// ──────────────────────────────────────────────
const getInventory = asyncHandler(async (req, res) => {
  const { status, category, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    Inventory.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Inventory.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    data: items,
  });
});

// ──────────────────────────────────────────────
// @desc    Get a single inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
// ──────────────────────────────────────────────
const getInventoryById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found.");
  }
  res.json({ success: true, data: item });
});

// ──────────────────────────────────────────────
// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private (manager/admin)
// ──────────────────────────────────────────────
const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.create({ ...req.body, addedBy: req.user.id });
  res.status(201).json({ success: true, data: item });
});

// ──────────────────────────────────────────────
// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private (manager/admin)
// ──────────────────────────────────────────────
const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found.");
  }
  res.json({ success: true, data: item });
});

// ──────────────────────────────────────────────
// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (admin only)
// ──────────────────────────────────────────────
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found.");
  }
  res.json({ success: true, message: "Item deleted successfully." });
});

// ──────────────────────────────────────────────
// @desc    Get inventory summary statistics
// @route   GET /api/inventory/stats
// @access  Private
// ──────────────────────────────────────────────
const getInventoryStats = asyncHandler(async (req, res) => {
  const stats = await Inventory.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
      },
    },
  ]);

  const totalItems = await Inventory.countDocuments();

  res.json({ success: true, totalItems, breakdown: stats });
});

module.exports = {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
};
