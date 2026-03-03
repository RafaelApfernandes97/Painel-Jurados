const express = require("express");
const { getJudgeAccess } = require("../controllers/judgeController");
const { createJudgeScore } = require("../controllers/scoreController");

const router = express.Router();

router.get("/jury/access/:token", getJudgeAccess);
router.post("/jury/score", createJudgeScore);

module.exports = router;
