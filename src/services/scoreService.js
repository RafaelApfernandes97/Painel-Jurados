const Choreography = require("../models/Choreography");
const Judge = require("../models/Judge");
const Score = require("../models/Score");
const ScoreLog = require("../models/ScoreLog");
const { emitJudgeScored } = require("./socketService");

function normalizeScore(value) {
  const rawValue = String(value).trim();
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    const error = new Error("nota must be numeric");
    error.statusCode = 400;
    throw error;
  }

  if (numericValue < 0 || numericValue > 10) {
    const error = new Error("nota must be between 0.00 and 10.00");
    error.statusCode = 400;
    throw error;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(rawValue)) {
    const error = new Error("nota must have at most 2 decimal places");
    error.statusCode = 400;
    throw error;
  }

  return Number(numericValue.toFixed(2));
}

async function ensureActiveJudgeByToken(token) {
  const judge = await Judge.findOne({
    token_acesso: token,
    ativo: true
  });

  if (!judge) {
    const error = new Error("Invalid or inactive judge access");
    error.statusCode = 404;
    throw error;
  }

  return judge;
}

async function ensureJudgeChoreographyAccess({ judge, choreographyId }) {
  const choreography = await Choreography.findOne({
    _id: choreographyId,
    clientId: judge.clientId,
    eventId: judge.eventId
  });

  if (!choreography) {
    const error = new Error("Choreography not found for this judge");
    error.statusCode = 404;
    throw error;
  }

  if (choreography.desistencia) {
    const error = new Error("Cannot score a withdrawn choreography");
    error.statusCode = 400;
    throw error;
  }

  return choreography;
}

async function findExistingScore({ judgeId, choreographyId }) {
  return Score.findOne({
    judgeId,
    choreographyId
  });
}

function buildJudgeScoredPayload({ score, judge, choreography }) {
  return {
    eventId: score.eventId,
    choreographyId: score.choreographyId,
    judgeId: score.judgeId,
    judgeNome: judge.nome,
    nome_coreografia: choreography.nome_coreografia,
    nota: score.nota,
    createdAt: score.createdAt
  };
}

async function submitJudgeScore({ token, choreographyId, nota }) {
  const judge = await ensureActiveJudgeByToken(token);
  const normalizedScore = normalizeScore(nota);
  const choreography = await ensureJudgeChoreographyAccess({
    judge,
    choreographyId
  });

  const existingScore = await findExistingScore({
    judgeId: judge._id,
    choreographyId: choreography._id
  });

  let score;
  let updated = false;

  if (existingScore) {
    if (existingScore.nota !== normalizedScore) {
      await ScoreLog.create({
        clientId: judge.clientId,
        eventId: judge.eventId,
        judgeId: judge._id,
        judge_nome: judge.nome,
        judge_telefone: judge.telefone || "",
        choreographyId: choreography._id,
        previousNota: existingScore.nota,
        newNota: normalizedScore
      });
    }

    existingScore.nota = normalizedScore;
    score = await existingScore.save();
    updated = true;
  } else {
    score = await Score.create({
      clientId: judge.clientId,
      eventId: judge.eventId,
      judgeId: judge._id,
      choreographyId: choreography._id,
      nota: normalizedScore
    });
  }

  const payload = buildJudgeScoredPayload({
    score,
    judge,
    choreography
  });

  emitJudgeScored(judge.eventId.toString(), payload);

  return {
    score,
    payload,
    updated
  };
}

module.exports = {
  normalizeScore,
  ensureActiveJudgeByToken,
  ensureJudgeChoreographyAccess,
  findExistingScore,
  buildJudgeScoredPayload,
  submitJudgeScore
};
