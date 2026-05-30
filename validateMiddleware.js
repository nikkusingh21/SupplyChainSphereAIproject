const { body, param, query, validationResult } = require("express-validator");

// ──────────────────────────────────────────────
// Helper: Run validation and respond with errors
// ──────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ──────────────────────────────────────────────
// Auth Validators
// ──────────────────────────────────────────────
const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("Please provide a valid email."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),
  validate,
];

const validateLogin = [
  body("email").isEmail().withMessage("Please provide a valid email."),
  body("password").notEmpty().withMessage("Password is required."),
  validate,
];

// ──────────────────────────────────────────────
// Inventory Validators
// ──────────────────────────────────────────────
const validateInventoryItem = [
  body("sku").trim().notEmpty().withMessage("SKU is required."),
  body("name").trim().notEmpty().withMessage("Product name is required."),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer."),
  body("unitCost")
    .isFloat({ min: 0 })
    .withMessage("Unit cost must be a non-negative number."),
  body("unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a non-negative number."),
  validate,
];

// ──────────────────────────────────────────────
// Forecast Validators
// ──────────────────────────────────────────────
const validateGenerateForecast = [
  body("productSku").trim().notEmpty().withMessage("Product SKU is required."),
  body("productName").trim().notEmpty().withMessage("Product name is required."),
  body("startDate").isISO8601().withMessage("startDate must be a valid ISO date."),
  body("endDate")
    .isISO8601()
    .withMessage("endDate must be a valid ISO date.")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("endDate must be after startDate.");
      }
      return true;
    }),
  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateInventoryItem,
  validateGenerateForecast,
};
