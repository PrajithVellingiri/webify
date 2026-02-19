const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const protect = require("./middleware/auth");

const app = express();

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again later."
});

// Middleware
app.use(express.json());
app.use(cors());

// 🔥 SERVE FRONTEND FILES
app.use(express.static("public"));

// API Routes (protected routes)
app.use("/api", limiter);
app.use("/api", authRoutes);
app.use("/api", protect, productRoutes);

// Apply stricter rate limit to auth routes (after general routes)
app.post("/api/login", authLimiter);
app.post("/api/signup", authLimiter);

// Redirect root to login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
