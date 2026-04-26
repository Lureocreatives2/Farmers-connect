const express          = require("express");
const router           = express.Router();
const { PrismaClient } = require("@prisma/client");
const { upload }       = require("../middleware/upload");
const { productRules, validate } = require("../middleware/validate");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────
// GET /api/products
// Browse all available products with filters + pagination
// Query: category, state, search, page, limit
// ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, state, search, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Only return approved products to the public
    const where = { status: "APPROVED", available: true };

    if (category) where.category = category.toUpperCase();
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (state) {
      where.farmer = { state: { contains: state, mode: "insensitive" } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
        include: {
          farmer: {
            select: {
              id:       true,
              farmName: true,
              state:    true,
              verified: true,
              user:     { select: { name:true, phone:true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data:    products,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("GET /products:", err);
    res.status(500).json({ success:false, message:"Failed to fetch products" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/products/:id
// Single product — full farmer details for the detail page
// ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where:   { id: req.params.id },
      include: {
        farmer: {
          include: {
            user: { select: { name:true, phone:true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success:false, message:"Product not found" });
    }

    res.json({ success:true, data:product });
  } catch (err) {
    console.error("GET /products/:id:", err);
    res.status(500).json({ success:false, message:"Failed to fetch product" });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/products
// Create a new listing — image uploaded to Cloudinary
// Body (multipart/form-data): farmerId, name, category,
//   price, unit, description, image (file)
// ─────────────────────────────────────────────────────────
router.post(
  "/",
  upload.single("image"),   // 1. Upload image → Cloudinary
  productRules,             // 2. Validate text fields
  validate,                 // 3. Return 422 if invalid
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success:false, message:"Product image is required" });
      }

      const { farmerId, name, category, price, unit, description } = req.body;

      const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
      if (!farmer) {
        return res.status(404).json({ success:false, message:"Farmer not found — register your farm first" });
      }

      const product = await prisma.product.create({
        data: {
          farmerId,
          name,
          category,
          price:       parseFloat(price),
          unit,
          description,
          imageUrl:    req.file.path, // Cloudinary URL
          status:      "PENDING",     // Requires admin approval
        },
        include: {
          farmer: { include: { user: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: "Product listed! It will be reviewed by our team and go live within 24 hours.",
        data:    product,
      });
    } catch (err) {
      console.error("POST /products:", err);
      res.status(500).json({ success:false, message:"Failed to create listing" });
    }
  }
);

// ─────────────────────────────────────────────────────────
// PATCH /api/products/:id/toggle
// Toggle a product's availability (farmer use)
// ─────────────────────────────────────────────────────────
router.patch("/:id/toggle", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ success:false, message:"Product not found" });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data:  { available: !product.available },
    });

    res.json({
      success: true,
      message: `Product marked as ${updated.available ? "available" : "unavailable"}`,
      data:    updated,
    });
  } catch (err) {
    res.status(500).json({ success:false, message:"Failed to update product" });
  }
});

module.exports = router;
