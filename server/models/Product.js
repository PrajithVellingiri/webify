const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    plannedQty: {
      type: Number,
      required: true,
    },

    plannedRate: {
      type: Number,
      required: true,
    },

    actualQty: {
      type: Number,
      required: true,
    },

    actualRate: {
      type: Number,
      required: true,
    },

    currentStock: {
      type: Number,
      required: true,
    },

    dailyConsumption: {
      type: Number,
      required: true,
    },

    leadTime: {
      type: Number,
      required: true,
    },

    safetyStock: {
      type: Number,
      required: true,
    },

    // Calculated fields
    plannedAmount: {
      type: Number,
    },

    actualAmount: {
      type: Number,
    },

    variance: {
      type: Number,
    },

    reorderLevel: {
      type: Number,
    },

    reorderQty: {
      type: Number,
    },

    riskScore: {
      type: Number,
    },

    riskCategory: {
      type: String,
      enum: ["Safe", "Warning", "Critical"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
