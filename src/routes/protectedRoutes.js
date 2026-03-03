const express = require("express");
const { getProtectedTest } = require("../controllers/protectedController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get(
  "/protected-test",
  authMiddleware,
  roleMiddleware(["superadmin", "admin"]),
  getProtectedTest
);

module.exports = router;
