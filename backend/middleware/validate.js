const { body, validationResult } = require("express-validator");

// Run validation and return early if errors found
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors:  errors.array().map((e) => ({ field:e.path, message:e.msg })),
    });
  }
  next();
};

// ── Product rules ─────────────────────────────────────────
const productRules = [
  body("farmerId")
    .notEmpty().withMessage("Farmer ID is required")
    .isUUID().withMessage("Invalid farmer ID format"),

  body("name")
    .trim().notEmpty().withMessage("Product name is required")
    .isLength({ min:2, max:100 }).withMessage("Name must be 2–100 characters"),

  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(["GRAINS","VEGETABLES","FRUITS","TUBERS","LEGUMES","LIVESTOCK","DAIRY","OTHER"])
    .withMessage("Invalid category"),

  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min:1 }).withMessage("Price must be a positive number"),

  body("unit")
    .trim().notEmpty().withMessage("Unit is required (e.g. kg, bag, crate)")
    .isLength({ max:30 }).withMessage("Unit must be under 30 characters"),

  body("description")
    .trim().notEmpty().withMessage("Description is required")
    .isLength({ min:10, max:1000 }).withMessage("Description must be 10–1000 characters"),
];

// ── Farmer rules ──────────────────────────────────────────
const farmerRules = [
  body("name")
    .trim().notEmpty().withMessage("Name is required")
    .isLength({ min:2, max:80 }).withMessage("Name must be 2–80 characters"),

  body("phone")
    .trim().notEmpty().withMessage("Phone number is required")
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage("Enter a valid Nigerian number (e.g. 08012345678)"),

  body("farmName")
    .trim().notEmpty().withMessage("Farm name is required")
    .isLength({ min:2, max:100 }).withMessage("Farm name must be 2–100 characters"),

  body("state")
    .trim().notEmpty().withMessage("State is required")
    .isLength({ min:2, max:50 }).withMessage("Invalid state name"),
];

module.exports = { validate, productRules, farmerRules };
