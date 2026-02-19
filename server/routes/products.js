const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// 🟢 POST /api/products
router.post("/products", async (req, res) => {
  try {
    const {
      itemName,
      plannedQty,
      plannedRate,
      actualQty,
      actualRate,
      currentStock,
      dailyConsumption,
      leadTime,
      safetyStock,
    } = req.body;

    // Input validation
    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ message: "Item name is required" });
    }
    if (plannedQty < 0 || plannedRate < 0 || actualQty < 0 || actualRate < 0) {
      return res.status(400).json({ message: "Quantities and rates must be positive" });
    }
    if (currentStock < 0 || dailyConsumption < 0 || leadTime < 0 || safetyStock < 0) {
      return res.status(400).json({ message: "Stock values must be positive" });
    }
    if (leadTime > 365) {
      return res.status(400).json({ message: "Lead time cannot exceed 365 days" });
    }

    // 🧮 Calculations
    const plannedAmount = plannedQty * plannedRate;
    const actualAmount = actualQty * actualRate;
    const variance = actualAmount - plannedAmount;

    const reorderLevel = dailyConsumption * leadTime + safetyStock;
    const reorderQty = Math.max(0, reorderLevel - currentStock);

    let riskScore = 0;
    if (reorderLevel > 0) {
      riskScore = ((reorderLevel - currentStock) / reorderLevel) * 100;
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskCategory = "Safe";
    if (riskScore > 70) {
      riskCategory = "Critical";
    } else if (riskScore >= 40) {
      riskCategory = "Warning";
    }

    const product = await Product.create({
      userId: req.user,
      itemName: itemName.trim(),
      plannedQty,
      plannedRate,
      actualQty,
      actualRate,
      currentStock,
      dailyConsumption,
      leadTime,
      safetyStock,
      plannedAmount,
      actualAmount,
      variance,
      reorderLevel,
      reorderQty,
      riskScore,
      riskCategory,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Add product error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔵 GET /api/products
router.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const products = await Product.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Product.countDocuments({ userId: req.user });
    
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟣 GET /api/summary
router.get("/summary", async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user });

    const totalPlannedCost = products.reduce(
      (sum, p) => sum + p.plannedAmount,
      0
    );

    const totalActualCost = products.reduce(
      (sum, p) => sum + p.actualAmount,
      0
    );

    const totalVariance = products.reduce(
      (sum, p) => sum + p.variance,
      0
    );

    const criticalItemCount = products.filter(
      (p) => p.riskCategory === "Critical"
    ).length;

    const projectedMonthlyLoss =
      totalVariance > 0 ? totalVariance * 30 : 0;

    res.json({
      totalPlannedCost,
      totalActualCost,
      totalVariance,
      criticalItemCount,
      projectedMonthlyLoss,
    });
  } catch (error) {
    console.error("Summary error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟣 GET /api/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const allProducts = await Product.find({ userId: req.user });
    const recentProducts = await Product.find({ userId: req.user }).sort({ createdAt: -1 }).limit(10);

    const totalPlannedCost = allProducts.reduce((sum, p) => sum + p.plannedAmount, 0);
    const totalActualCost = allProducts.reduce((sum, p) => sum + p.actualAmount, 0);
    const totalVariance = allProducts.reduce((sum, p) => sum + p.variance, 0);
    const criticalItemCount = allProducts.filter((p) => p.riskCategory === "Critical").length;

    res.json({
      summary: {
        totalPlannedCost,
        totalActualCost,
        totalVariance,
        criticalItemCount,
      },
      recentProducts
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟡 PUT /api/products/:id
router.put("/products/:id", async (req, res) => {
  console.log("PUT /api/products/:id called");
  console.log("Product ID:", req.params.id);
  console.log("User ID:", req.user);
  console.log("Request body:", req.body);
  
  try {
    const {
      itemName,
      plannedQty,
      plannedRate,
      actualQty,
      actualRate,
      currentStock,
      dailyConsumption,
      leadTime,
      safetyStock,
    } = req.body;

    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.user });
    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ message: "Product not found" });
    }

    // Input validation
    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ message: "Item name is required" });
    }
    if (plannedQty < 0 || plannedRate < 0 || actualQty < 0 || actualRate < 0) {
      return res.status(400).json({ message: "Quantities and rates must be positive" });
    }
    if (currentStock < 0 || dailyConsumption < 0 || leadTime < 0 || safetyStock < 0) {
      return res.status(400).json({ message: "Stock values must be positive" });
    }
    if (leadTime > 365) {
      return res.status(400).json({ message: "Lead time cannot exceed 365 days" });
    }

    // Calculations
    const plannedAmount = plannedQty * plannedRate;
    const actualAmount = actualQty * actualRate;
    const variance = actualAmount - plannedAmount;
    const reorderLevel = dailyConsumption * leadTime + safetyStock;
    const reorderQty = Math.max(0, reorderLevel - currentStock);
    
    let riskScore = 0;
    if (reorderLevel > 0) {
      riskScore = ((reorderLevel - currentStock) / reorderLevel) * 100;
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskCategory = "Safe";
    if (riskScore > 70) riskCategory = "Critical";
    else if (riskScore >= 40) riskCategory = "Warning";

    product.itemName = itemName.trim();
    product.plannedQty = plannedQty;
    product.plannedRate = plannedRate;
    product.actualQty = actualQty;
    product.actualRate = actualRate;
    product.currentStock = currentStock;
    product.dailyConsumption = dailyConsumption;
    product.leadTime = leadTime;
    product.safetyStock = safetyStock;
    product.plannedAmount = plannedAmount;
    product.actualAmount = actualAmount;
    product.variance = variance;
    product.reorderLevel = reorderLevel;
    product.reorderQty = reorderQty;
    product.riskScore = riskScore;
    product.riskCategory = riskCategory;

    await product.save();
    console.log("Product updated successfully");
    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// 🔴 DELETE /api/products/:id
router.delete("/products/:id", async (req, res) => {
  console.log("DELETE /api/products/:id called");
  console.log("Product ID:", req.params.id);
  console.log("User ID:", req.user);
  
  try {
    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ message: "Product not found" });
    }
    console.log("Product deleted successfully");
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

module.exports = router;
