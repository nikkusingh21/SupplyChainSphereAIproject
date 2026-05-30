const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["electronics", "apparel", "food", "machinery", "raw_materials", "other"],
      default: "other",
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    reorderPoint: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      required: true,
      default: 200,
      min: 1,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      name: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
      leadTimeDays: { type: Number, default: 7 },
    },
    warehouse: {
      type: String,
      default: "Main Warehouse",
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "discontinued"],
      default: "in_stock",
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ----- Virtual: Total inventory value -----
inventorySchema.virtual("totalValue").get(function () {
  return (this.quantity * this.unitCost).toFixed(2);
});

// ----- Pre-save hook: Auto-update status based on quantity -----
inventorySchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= this.reorderPoint) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
