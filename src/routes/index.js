const express = require("express");
const authRoutes = require("./authRoutes");
const eventRoutes = require("./eventRoutes");
const healthRoutes = require("./healthRoutes");
const juryAccessRoutes = require("./juryAccessRoutes");
const protectedRoutes = require("./protectedRoutes");
const registrationRoutes = require("./registrationRoutes");
const financialRoutes = require("./financialRoutes");
const certificateRoutes = require("./certificateRoutes");
const superAdminRoutes = require("./superAdminRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(eventRoutes);
router.use(healthRoutes);
router.use(juryAccessRoutes);
router.use(protectedRoutes);
router.use(registrationRoutes);
router.use(financialRoutes);
router.use(certificateRoutes);
router.use(superAdminRoutes);

module.exports = router;
