const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables.");
    console.error("👉 Please set MONGODB_URI in your .env file or hosting provider configuration.");
    return false;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    // In production web services, allow server to boot and report health instead of instant exit
    return false;
  }
};

module.exports = connectDB;
