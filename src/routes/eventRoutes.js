const express = require("express");
const {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent
} = require("../controllers/eventController");
const {
  callChoreography,
  createChoreography,
  deleteChoreography,
  getCurrentChoreography,
  listChoreographies,
  returnChoreographyToQueue,
  updateChoreography
} = require("../controllers/choreographyController");
const { createJudge, listJudges } = require("../controllers/judgeController");
const { getEventRanking, listChoreographyScores } = require("../controllers/scoreController");
const authMiddleware = require("../middlewares/authMiddleware");
const clientIsolationMiddleware = require("../middlewares/clientIsolationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(["/events", "/choreographies"], authMiddleware, roleMiddleware(["admin"]), clientIsolationMiddleware);

router.post("/events", createEvent);
router.get("/events", listEvents);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

router.post("/events/:eventId/choreographies", createChoreography);
router.get("/events/:eventId/choreographies", listChoreographies);
router.get("/events/:eventId/current-choreography", getCurrentChoreography);
router.post("/events/:eventId/judges", createJudge);
router.get("/events/:eventId/judges", listJudges);
router.post("/events/:eventId/call/:choreographyId", callChoreography);
router.post("/events/:eventId/queue/:choreographyId", returnChoreographyToQueue);
router.get("/events/:eventId/scores/:choreographyId", listChoreographyScores);
router.get("/events/:eventId/ranking", getEventRanking);
router.put("/choreographies/:id", updateChoreography);
router.delete("/choreographies/:id", deleteChoreography);

module.exports = router;
