const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const secret = process.env.JWT_SECRET || "webify_super_secret_fallback_key_2026";
      const decoded = jwt.verify(token, secret);

      // Attach userId to request
      req.user = decoded.id;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Session expired or invalid token. Please log in again." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = protect;
