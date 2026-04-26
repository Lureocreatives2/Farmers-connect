const express          = require("express");
const router           = express.Router();
const { PrismaClient } = require("@prisma/client");
const { farmerRules, validate } = require("../middleware/validate");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────
// POST /api/farmers/register
// Register a new farmer — creates User + Farmer in one tx
// ─────────────────────────────────────────────────────────
router.post("/register", farmerRules, validate, async (req, res) => {
  try {
    const { name, phone, farmName, state } = req.body;

    // Prevent duplicate registrations
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A farmer with this phone number is already registered",
      });
    }

    // Create User + Farmer atomically
    const result = await prisma.$transaction(async (tx) => {
      const user   = await tx.user.create({ data: { name, phone, role:"FARMER" } });
      const farmer = await tx.farmer.create({
        data:    { userId:user.id, farmName, state },
        include: { user:true },
      });
      return farmer;
    });

    res.status(201).json({
      success: true,
      message: "Farm registered successfully! Save your Farmer ID to list products.",
      data: {
        farmerId: result.id,
        name:     result.user.name,
        phone:    result.user.phone,
        farmName: result.farmName,
        state:    result.state,
      },
    });
  } catch (err) {
    console.error("POST /farmers/register:", err);
    res.status(500).json({ success:false, message:"Registration failed" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/farmers/lookup/:phone
// Look up a farmer by phone number
// Used on the "List Product" page to verify identity
// ─────────────────────────────────────────────────────────
router.get("/lookup/:phone", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { phone: req.params.phone },
      include: { farmer: true },
    });

    if (!user || !user.farmer) {
      return res.status(404).json({
        success: false,
        message: "No farmer found with this phone number. Please register first.",
      });
    }

    res.json({
      success: true,
      data: {
        farmerId: user.farmer.id,
        name:     user.name,
        farmName: user.farmer.farmName,
        state:    user.farmer.state,
        verified: user.farmer.verified,
      },
    });
  } catch (err) {
    res.status(500).json({ success:false, message:"Lookup failed" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/farmers/:id
// Farmer profile — full details + all their products
// ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where:   { id: req.params.id },
      include: {
        user:     { select: { name:true, phone:true } },
        products: {
          where:   { status:"APPROVED", available:true },
          orderBy: { createdAt:"desc" },
        },
      },
    });

    if (!farmer) {
      return res.status(404).json({ success:false, message:"Farmer not found" });
    }

    res.json({ success:true, data:farmer });
  } catch (err) {
    res.status(500).json({ success:false, message:"Failed to fetch farmer profile" });
  }
});

module.exports = router;
