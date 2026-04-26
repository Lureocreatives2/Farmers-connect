const express          = require("express");
const router           = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── Auth middleware ───────────────────────────────────────
function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== (process.env.ADMIN_SECRET || "fc-admin-secret-token-2024")) {
    return res.status(401).json({ success:false, message:"Unauthorized" });
  }
  next();
}

// All routes except login require the token
router.use(adminAuth);

// ─────────────────────────────────────────────────────────
// GET /api/admin/stats  — dashboard summary
// ─────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [total, pending, approved, rejected, flagged, thisWeek,
           totalFarmers, verified, totalUsers, byCategory, byState] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where:{ status:"PENDING"  } }),
      prisma.product.count({ where:{ status:"APPROVED" } }),
      prisma.product.count({ where:{ status:"REJECTED" } }),
      prisma.product.count({ where:{ status:"FLAGGED"  } }),
      prisma.product.count({ where:{ createdAt:{ gte: new Date(Date.now()-7*86400000) } } }),
      prisma.farmer.count(),
      prisma.farmer.count({ where:{ verified:true } }),
      prisma.user.count(),
      prisma.product.groupBy({ by:["category"], _count:{ id:true }, orderBy:{ _count:{ id:"desc" } } }),
      prisma.farmer.groupBy({ by:["state"],    _count:{ id:true }, orderBy:{ _count:{ id:"desc" } }, take:8 }),
    ]);

    res.json({
      success: true,
      data: {
        products: { total, pending, approved, rejected, flagged, thisWeek },
        farmers:  { total:totalFarmers, verified, unverified:totalFarmers-verified },
        users:    { total:totalUsers },
        byCategory: byCategory.map(c => ({ category:c.category, count:c._count.id })),
        byState:    byState.map(s    => ({ state:s.state,       count:s._count.id })),
      },
    });
  } catch (err) {
    console.error("GET /admin/stats:", err);
    res.status(500).json({ success:false, message:"Failed to fetch stats" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/products  — all products with filters
// Query: status, category, search, page, limit
// ─────────────────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const { status, category, search, page=1, limit=20 } = req.query;
    const skip  = (parseInt(page)-1) * parseInt(limit);
    const where = {};
    if (status)   where.status   = status;
    if (category) where.category = category;
    if (search)   where.OR = [
      { name:        { contains:search, mode:"insensitive" } },
      { description: { contains:search, mode:"insensitive" } },
    ];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt:"desc" },
        skip, take: parseInt(limit),
        include: { farmer: { include: { user:{ select:{ name:true, phone:true } } } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data:    products,
      pagination: { total, page:parseInt(page), limit:parseInt(limit), totalPages:Math.ceil(total/parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success:false, message:"Failed to fetch products" });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/products/:id/status
// Approve / reject / flag a product
// Body: { status: "APPROVED"|"REJECTED"|"FLAGGED"|"PENDING" }
// ─────────────────────────────────────────────────────────
router.patch("/products/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["APPROVED","REJECTED","FLAGGED","PENDING"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success:false, message:`Status must be one of: ${allowed.join(", ")}` });
    }

    const product = await prisma.product.update({
      where: { id:req.params.id },
      data:  { status, available: status==="APPROVED" },
      include: { farmer: { include: { user:{ select:{ name:true } } } } },
    });

    res.json({ success:true, message:`"${product.name}" has been ${status.toLowerCase()}`, data:product });
  } catch (err) {
    if (err.code==="P2025") return res.status(404).json({ success:false, message:"Product not found" });
    res.status(500).json({ success:false, message:"Failed to update status" });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/products/:id  — permanently delete
// ─────────────────────────────────────────────────────────
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.delete({ where:{ id:req.params.id } });
    res.json({ success:true, message:`"${product.name}" permanently deleted` });
  } catch (err) {
    if (err.code==="P2025") return res.status(404).json({ success:false, message:"Product not found" });
    res.status(500).json({ success:false, message:"Failed to delete product" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/farmers  — all farmers with filters
// Query: verified, search, page, limit
// ─────────────────────────────────────────────────────────
router.get("/farmers", async (req, res) => {
  try {
    const { verified, search, page=1, limit=20 } = req.query;
    const skip  = (parseInt(page)-1) * parseInt(limit);
    const where = {};
    if (verified !== undefined) where.verified = verified==="true";
    if (search) where.OR = [
      { farmName: { contains:search, mode:"insensitive" } },
      { state:    { contains:search, mode:"insensitive" } },
      { user:     { name: { contains:search, mode:"insensitive" } } },
    ];

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where,
        orderBy: { createdAt:"desc" },
        skip, take: parseInt(limit),
        include: {
          user:   { select:{ name:true, phone:true, createdAt:true } },
          _count: { select:{ products:true } },
        },
      }),
      prisma.farmer.count({ where }),
    ]);

    res.json({
      success: true,
      data:    farmers,
      pagination: { total, page:parseInt(page), limit:parseInt(limit), totalPages:Math.ceil(total/parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success:false, message:"Failed to fetch farmers" });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/farmers/:id/verify
// Toggle farmer verified status
// Body: { verified: true|false }
// ─────────────────────────────────────────────────────────
router.patch("/farmers/:id/verify", async (req, res) => {
  try {
    const farmer = await prisma.farmer.update({
      where: { id:req.params.id },
      data:  { verified: Boolean(req.body.verified) },
      include: { user:{ select:{ name:true } } },
    });
    res.json({
      success: true,
      message: `${farmer.farmName} ${req.body.verified?"verified ✓":"unverified"}`,
      data:    farmer,
    });
  } catch (err) {
    if (err.code==="P2025") return res.status(404).json({ success:false, message:"Farmer not found" });
    res.status(500).json({ success:false, message:"Failed to update farmer" });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/farmers/:id
// Remove farmer + cascade delete products + user record
// ─────────────────────────────────────────────────────────
router.delete("/farmers/:id", async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where:   { id:req.params.id },
      include: { user:true },
    });
    if (!farmer) return res.status(404).json({ success:false, message:"Farmer not found" });

    await prisma.$transaction([
      prisma.product.deleteMany({ where:{ farmerId:req.params.id } }),
      prisma.farmer.delete({ where:{ id:req.params.id } }),
      prisma.user.delete({ where:{ id:farmer.userId } }),
    ]);

    res.json({ success:true, message:`${farmer.farmName} and all their listings removed` });
  } catch (err) {
    res.status(500).json({ success:false, message:"Failed to delete farmer" });
  }
});

// ─────────────────────────────────────────────────────────
// Admin login handler — exported separately (no auth needed)
// Called via POST /api/admin/login in server.js
// ─────────────────────────────────────────────────────────
function adminLogin(req, res) {
  const { username, password } = req.body || {};
  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPass = process.env.ADMIN_PASSWORD || "farmersconnect2024";

  if (username === validUser && password === validPass) {
    return res.json({
      success: true,
      token:   process.env.ADMIN_SECRET || "fc-admin-secret-token-2024",
      admin:   { username:validUser, role:"Super Admin" },
    });
  }
  res.status(401).json({ success:false, message:"Invalid username or password" });
}

module.exports = { router, adminLogin };
