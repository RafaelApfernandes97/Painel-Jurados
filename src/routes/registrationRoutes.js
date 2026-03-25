const express = require("express");
const {
  getPublicEventInfo,
  createPublicRegistration,
  listRegistrations,
  updateRegistration,
  updateCoreografiaVideo,
  deleteRegistration,
  approveAndConvert
} = require("../controllers/registrationController");
const authMiddleware = require("../middlewares/authMiddleware");
const clientIsolationMiddleware = require("../middlewares/clientIsolationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// ── Public routes (no auth) ──
router.get("/public/events/:eventId/info", getPublicEventInfo);
router.post("/public/events/:eventId/registrations", createPublicRegistration);

// ── Admin routes (auth required) ──
router.get(
  "/events/:eventId/registrations",
  authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware,
  listRegistrations
);

router.put(
  "/registrations/:id",
  authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware,
  updateRegistration
);

router.put(
  "/registrations/:id/coreografias/:coreografiaId/video",
  authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware,
  updateCoreografiaVideo
);

router.delete(
  "/registrations/:id",
  authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware,
  deleteRegistration
);

router.post(
  "/registrations/:id/approve",
  authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware,
  approveAndConvert
);

module.exports = router;
