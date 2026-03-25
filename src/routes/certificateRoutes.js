const express = require("express");
const {
  listCertificates,
  getCertificate
} = require("../controllers/certificateController");
const authMiddleware = require("../middlewares/authMiddleware");
const clientIsolationMiddleware = require("../middlewares/clientIsolationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get(
  "/events/:eventId/certificates",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  listCertificates
);

router.get(
  "/events/:eventId/certificates/:choreographyId",
  authMiddleware,
  roleMiddleware(["admin"]),
  clientIsolationMiddleware,
  getCertificate
);

module.exports = router;
