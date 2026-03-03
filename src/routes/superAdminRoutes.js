const express = require("express");
const {
  createClient,
  deleteClient,
  getClientEvents,
  getDashboard,
  listClients,
  toggleClientStatus,
  updateClient
} = require("../controllers/superAdminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["superadmin"]));

router.get("/superadmin/dashboard", getDashboard);
router.get("/superadmin/clients", listClients);
router.post("/superadmin/clients", createClient);
router.put("/superadmin/clients/:id", updateClient);
router.patch("/superadmin/clients/:id/toggle-status", toggleClientStatus);
router.delete("/superadmin/clients/:id", deleteClient);
router.get("/superadmin/clients/:id/events", getClientEvents);

module.exports = router;
