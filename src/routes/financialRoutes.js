const express = require("express");
const {
  getEventFinancialSummary,
  getFinancialBySchool,
  getFinancialDetails,
  registerPayment,
  calculateRegistrationValue
} = require("../controllers/financialController");
const authMiddleware = require("../middlewares/authMiddleware");
const clientIsolationMiddleware = require("../middlewares/clientIsolationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// ── Public: calculate registration value (preview) ──
router.post("/public/events/:eventId/financial/calculate", calculateRegistrationValue);

// ── Admin routes (auth required) ──
router.get(
  "/events/:eventId/financial/summary",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  getEventFinancialSummary
);

router.get(
  "/events/:eventId/financial/by-school",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  getFinancialBySchool
);

router.get(
  "/events/:eventId/financial/details",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  getFinancialDetails
);

router.post(
  "/registrations/:id/payments",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  registerPayment
);

module.exports = router;
