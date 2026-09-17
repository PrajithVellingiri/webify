const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const protect = require("./middleware/auth");

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting behind reverse proxies like Render / Vercel
app.set("trust proxy", 1);

// CORS configuration supporting production frontends & local dev
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin static files)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback for seamless client preview
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." },
});

// Health check endpoints (no rate limit applied for uptime monitors)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Webify Inventory API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Webify Inventory API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Webify Inventory Management System API",
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: ["POST /api/signup", "POST /api/login", "GET /api/user/:id"],
      products: ["GET /api/products", "POST /api/products", "PUT /api/products/:id", "DELETE /api/products/:id"],
      analytics: ["GET /api/summary", "GET /api/dashboard"],
    },
  });
});

// Apply rate limiting to API
app.use("/api", generalLimiter);

// Specific stricter limiter for Auth endpoints (registered BEFORE auth routes)
app.use("/api/login", authLimiter);
app.use("/api/signup", authLimiter);

// Auth Routes (Public)
app.use("/api", authRoutes);

// Protected Product & Dashboard Routes
app.use("/api", protect, productRoutes);

// Root endpoint — Pure API Status
app.get("/", (req, res) => {
  res.json({
    name: "Webify IMS — Inventory Management System API",
    status: "online",
    version: "1.0.0",
    health: "/health",
    endpoints: "/api"
  });
});

// 404 Handler for undefined API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🔥 Webify Server running at http://${HOST}:${PORT}`);
});

