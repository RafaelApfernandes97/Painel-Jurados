const express = require("express");
const { getJudgeAccess } = require("../controllers/judgeController");
const { createJudgeScore, getJudgeScoreLogs } = require("../controllers/scoreController");

const router = express.Router();

router.get("/jury/access/:token", getJudgeAccess);
router.post("/jury/score", createJudgeScore);
router.get("/jury/score-logs/:token/:choreographyId", getJudgeScoreLogs);

module.exports = router;
