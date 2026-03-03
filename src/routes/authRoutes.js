const express = require("express");
const { clientLogin, superAdminLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/auth/superadmin/login", superAdminLogin);
router.post("/auth/client/login", clientLogin);

module.exports = router;
