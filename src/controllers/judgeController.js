const Block = require("../models/Block");
const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Judge = require("../models/Judge");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");
const { buildJudgeAccessLink, generateJudgeAccessToken } = require("../services/judgeAccessService");
const { buildCurrentChoreographyPayload } = require("../services/currentChoreographyService");

async function ensureClientEvent(eventId, clientId) {
  const event = await Event.findOne({
    _id: eventId,
    clientId
  });

  if (!event) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  return event;
}

function parseActiveValue(value) {
  if (value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

async function createJudge(req, res, next) {
  try {
    const { eventId } = req.params;
    const { nome, telefone, ativo, palco } = req.body;
    const clientFilter = req.clientFilter || getClientFilter(req);

    if (!nome || !telefone) {
      const error = new Error("nome and telefone are required");
      error.statusCode = 400;
      throw error;
    }

    await ensureClientEvent(eventId, clientFilter.clientId);

    const tokenAcesso = await generateJudgeAccessToken();
    const judge = await Judge.create({
      clientId: clientFilter.clientId,
      eventId,
      nome,
      telefone,
      token_acesso: tokenAcesso,
      ativo: parseActiveValue(ativo),
      palco: palco || ""
    });

    res.status(201).json({
      judge,
      accessLink: buildJudgeAccessLink(tokenAcesso)
    });
  } catch (error) {
    next(error);
  }
}

async function getJudgeAccess(req, res, next) {
  try {
    const { token } = req.params;
    const judge = await Judge.findOne({
      token_acesso: token,
      ativo: true
    }).populate({
      path: "eventId",
      populate: {
        path: "currentChoreographyId"
      }
    });

    if (!judge || !judge.eventId) {
      const error = new Error("Invalid or inactive judge access");
      error.statusCode = 404;
      throw error;
    }

    const currentChoreography = judge.eventId.currentChoreographyId;
    const currentScore = currentChoreography
      ? await Score.findOne({
          judgeId: judge._id,
          choreographyId: currentChoreography._id
        })
      : null;

    const presentedChoreographies = await Choreography.find({
      eventId: judge.eventId._id,
      clientId: judge.clientId,
      presentedAt: { $ne: null }
    }).sort({ presentedAt: 1, ordem_apresentacao: 1 });

    const presentedIds = presentedChoreographies.map((item) => item._id);
    const judgeScores = presentedIds.length
      ? await Score.find({
          judgeId: judge._id,
          choreographyId: { $in: presentedIds }
        })
      : [];

    const scoreMap = new Map(
      judgeScores.map((score) => [
        score.choreographyId.toString(),
        {
          nota: score.nota,
          createdAt: score.createdAt,
          updatedAt: score.updatedAt
        }
      ])
    );

    const blocks = await Block.find({
      eventId: judge.eventId._id,
      clientId: judge.clientId
    }).sort({ ordem: 1 });

    res.status(200).json({
      judge: {
        id: judge._id,
        nome: judge.nome
      },
      event: {
        id: judge.eventId._id,
        nome: judge.eventId.nome,
        local: judge.eventId.local,
        data: judge.eventId.data,
        status: judge.eventId.status
      },
      currentChoreography: currentChoreography
        ? buildCurrentChoreographyPayload(currentChoreography)
        : null,
      presentedChoreographies: presentedChoreographies.map((item) => ({
        choreography: buildCurrentChoreographyPayload(item),
        presentedAt: item.presentedAt,
        score: scoreMap.get(item._id.toString()) || null
      })),
      blocks: blocks.map((block) => ({
        id: block._id,
        nome: block.nome,
        ordem: block.ordem
      })),
      currentScoreSubmitted: Boolean(currentScore),
      currentScore: currentScore
        ? {
            nota: currentScore.nota,
            createdAt: currentScore.createdAt,
            updatedAt: currentScore.updatedAt
          }
        : null
    });
  } catch (error) {
    next(error);
  }
}

async function listJudges(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const judges = await Judge.find({
      eventId,
      ...clientFilter
    }).sort({ nome: 1, createdAt: -1 });

    res.status(200).json(judges);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJudge,
  getJudgeAccess,
  listJudges
};
