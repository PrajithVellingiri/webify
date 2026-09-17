const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// 🟢 POST /api/products
router.post("/products", async (req, res) => {
  try {
    const {
      itemName,
      category,
      sku,
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
    const numPlannedQty = Number(plannedQty) || 0;
    const numPlannedRate = Number(plannedRate) || 0;
    const numActualQty = Number(actualQty) || 0;
    const numActualRate = Number(actualRate) || 0;
    const numCurrentStock = Number(currentStock) || 0;
    const numDailyConsumption = Number(dailyConsumption) || 0;
    const numLeadTime = Number(leadTime) || 0;
    const numSafetyStock = Number(safetyStock) || 0;

    if (numPlannedQty < 0 || numPlannedRate < 0 || numActualQty < 0 || numActualRate < 0) {
      return res.status(400).json({ message: "Quantities and rates must be positive numbers" });
    }
    if (numCurrentStock < 0 || numDailyConsumption < 0 || numLeadTime < 0 || numSafetyStock < 0) {
      return res.status(400).json({ message: "Stock parameters must be positive numbers" });
    }
    if (numLeadTime > 365) {
      return res.status(400).json({ message: "Lead time cannot exceed 365 days" });
    }

    // 🧮 Calculations
    const plannedAmount = numPlannedQty * numPlannedRate;
    const actualAmount = numActualQty * numActualRate;
    const variance = actualAmount - plannedAmount;

    const reorderLevel = numDailyConsumption * numLeadTime + numSafetyStock;
    const reorderQty = Math.max(0, reorderLevel - numCurrentStock);

    let riskScore = 0;
    if (reorderLevel > 0) {
      riskScore = ((reorderLevel - numCurrentStock) / reorderLevel) * 100;
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskCategory = "Safe";
    if (riskScore > 70) {
      riskCategory = "Critical";
    } else if (riskScore >= 40) {
      riskCategory = "Warning";
    }

    const generatedSku = (sku && sku.trim()) || `SKU-${Date.now().toString(36).toUpperCase()}`;

    const product = await Product.create({
      userId: req.user,
      itemName: itemName.trim(),
      category: (category && category.trim()) || "General",
      sku: generatedSku,
      plannedQty: numPlannedQty,
      plannedRate: numPlannedRate,
      actualQty: numActualQty,
      actualRate: numActualRate,
      currentStock: numCurrentStock,
      dailyConsumption: numDailyConsumption,
      leadTime: numLeadTime,
      safetyStock: numSafetyStock,
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
    res.status(500).json({ message: "Failed to add product: " + error.message });
  }
});

// 🔵 GET /api/products (with search, category/risk filtering, and sorting)
router.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { userId: req.user };

    // Search by item name, SKU, or category
    if (req.query.search && req.query.search.trim().length > 0) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [
        { itemName: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
      ];
    }

    // Filter by risk category
    if (req.query.riskCategory && req.query.riskCategory !== "all") {
      query.riskCategory = req.query.riskCategory;
    }

    // Dynamic sorting
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = order;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res.status(500).json({ message: "Failed to load products" });
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
      category,
      sku,
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
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOne({ _id: req.params.id, userId: req.user });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Input validation
    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ message: "Item name is required" });
    }

    const numPlannedQty = Number(plannedQty) || 0;
    const numPlannedRate = Number(plannedRate) || 0;
    const numActualQty = Number(actualQty) || 0;
    const numActualRate = Number(actualRate) || 0;
    const numCurrentStock = Number(currentStock) || 0;
    const numDailyConsumption = Number(dailyConsumption) || 0;
    const numLeadTime = Number(leadTime) || 0;
    const numSafetyStock = Number(safetyStock) || 0;

    if (numPlannedQty < 0 || numPlannedRate < 0 || numActualQty < 0 || numActualRate < 0) {
      return res.status(400).json({ message: "Quantities and rates must be positive numbers" });
    }
    if (numCurrentStock < 0 || numDailyConsumption < 0 || numLeadTime < 0 || numSafetyStock < 0) {
      return res.status(400).json({ message: "Stock parameters must be positive numbers" });
    }
    if (numLeadTime > 365) {
      return res.status(400).json({ message: "Lead time cannot exceed 365 days" });
    }

    // Calculations
    const plannedAmount = numPlannedQty * numPlannedRate;
    const actualAmount = numActualQty * numActualRate;
    const variance = actualAmount - plannedAmount;
    const reorderLevel = numDailyConsumption * numLeadTime + numSafetyStock;
    const reorderQty = Math.max(0, reorderLevel - numCurrentStock);
    
    let riskScore = 0;
    if (reorderLevel > 0) {
      riskScore = ((reorderLevel - numCurrentStock) / reorderLevel) * 100;
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskCategory = "Safe";
    if (riskScore > 70) riskCategory = "Critical";
    else if (riskScore >= 40) riskCategory = "Warning";

    product.itemName = itemName.trim();
    if (category) product.category = category.trim();
    if (sku) product.sku = sku.trim();
    product.plannedQty = numPlannedQty;
    product.plannedRate = numPlannedRate;
    product.actualQty = numActualQty;
    product.actualRate = numActualRate;
    product.currentStock = numCurrentStock;
    product.dailyConsumption = numDailyConsumption;
    product.leadTime = numLeadTime;
    product.safetyStock = numSafetyStock;
    product.plannedAmount = plannedAmount;
    product.actualAmount = actualAmount;
    product.variance = variance;
    product.reorderLevel = reorderLevel;
    product.reorderQty = reorderQty;
    product.riskScore = riskScore;
    product.riskCategory = riskCategory;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error("Update product error:", error.message);
    res.status(500).json({ message: "Failed to update product: " + error.message });
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
