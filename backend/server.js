require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const productRoutes              = require("./routes/products");
const farmerRoutes               = require("./routes/farmers");
const { router: adminRoutes, adminLogin } = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin:         process.env.FRONTEND_URL || "*",
  methods:        ["GET","POST","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","x-admin-token"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

// ── Health check ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:  "ok",
    app:     "Farmers Connect API",
    version: "1.0.0",
    ts:      new Date().toISOString(),
  });
});

// ── Public routes ──────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/farmers",  farmerRoutes);

// ── Admin login (no auth token needed) ────────────────────
app.post("/api/admin/login", adminLogin);

// ── Admin routes (protected by x-admin-token header) ──────
app.use("/api/admin", adminRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success:false, message:"Route not found" });
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack:err.stack }),
  });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 Farmers Connect API`);
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Health: http://localhost:${PORT}/health`);
  console.log(`   → Env: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
