const express = require("express");
const {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  getEventDashboard
} = require("../controllers/eventController");
const {
  callChoreography,
  createChoreography,
  deleteChoreography,
  getCurrentChoreography,
  importChoreographies,
  listChoreographies,
  restoreChoreography,
  returnChoreographyToQueue,
  updateChoreography,
  withdrawChoreography
} = require("../controllers/choreographyController");
const { createJudge, listJudges } = require("../controllers/judgeController");
const {
  assignChoreographies,
  createBlock,
  deleteBlock,
  listBlocks,
  updateBlock
} = require("../controllers/blockController");
const { getEventRanking, listChoreographyScores } = require("../controllers/scoreController");
const authMiddleware = require("../middlewares/authMiddleware");
const clientIsolationMiddleware = require("../middlewares/clientIsolationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(["/events", "/choreographies", "/blocks"], authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware);

router.post("/events", createEvent);
router.get("/events", listEvents);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);
router.get("/events/:eventId/dashboard", getEventDashboard);

router.post("/events/:eventId/choreographies", createChoreography);
router.post("/events/:eventId/choreographies/import", importChoreographies);
router.get("/events/:eventId/choreographies", listChoreographies);
router.get("/events/:eventId/current-choreography", getCurrentChoreography);
router.post("/events/:eventId/judges", createJudge);
router.get("/events/:eventId/judges", listJudges);
router.post("/events/:eventId/call/:choreographyId", callChoreography);
router.post("/events/:eventId/queue/:choreographyId", returnChoreographyToQueue);
router.post("/events/:eventId/withdraw/:choreographyId", withdrawChoreography);
router.post("/events/:eventId/restore/:choreographyId", restoreChoreography);
router.get("/events/:eventId/scores/:choreographyId", listChoreographyScores);
router.get("/events/:eventId/ranking", getEventRanking);
router.put("/choreographies/:id", updateChoreography);
router.delete("/choreographies/:id", deleteChoreography);

router.post("/events/:eventId/blocks", createBlock);
router.get("/events/:eventId/blocks", listBlocks);
router.put("/blocks/:id", updateBlock);
router.delete("/blocks/:id", deleteBlock);
router.put("/events/:eventId/blocks/:id/choreographies", assignChoreographies);

module.exports = router;
