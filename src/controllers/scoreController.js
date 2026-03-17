const Choreography = require("../models/Choreography");
const Judge = require("../models/Judge");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");
const ScoreLog = require("../models/ScoreLog");
const {
  ensureActiveJudgeByToken,
  ensureJudgeChoreographyAccess,
  submitJudgeScore
} = require("../services/scoreService");
const { ensureClientEvent } = require("../services/currentChoreographyService");

async function createJudgeScore(req, res, next) {
  try {
    const { token, choreographyId, nota } = req.body;

    if (!token || !choreographyId || nota === undefined) {
      const error = new Error("token, choreographyId and nota are required");
      error.statusCode = 400;
      throw error;
    }

    const { score, updated } = await submitJudgeScore({
      token,
      choreographyId,
      nota
    });

    res.status(200).json({
      message: updated ? "Score updated successfully" : "Score submitted successfully",
      score
    });
  } catch (error) {
    next(error);
  }
}

async function listChoreographyScores(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);
    await ensureJudgeChoreographyAccess({
      judge: {
        clientId: clientFilter.clientId,
        eventId
      },
      choreographyId
    });

    const [judges, scores, scoreLogs] = await Promise.all([
      Judge.find({
        eventId,
        ...clientFilter
      }).sort({ nome: 1 }),
      Score.find({
        eventId,
        choreographyId,
        ...clientFilter
      }).sort({ createdAt: 1 }),
      ScoreLog.find({
        eventId,
        choreographyId,
        ...clientFilter
      }).sort({ createdAt: 1 })
    ]);

    const scoreMap = new Map(
      scores.map((score) => [
        score.judgeId.toString(),
        {
          scoreId: score._id,
          nota: score.nota,
          createdAt: score.createdAt
        }
      ])
    );

    const judgeStatus = judges.map((judge) => {
      const score = scoreMap.get(judge._id.toString());

      return {
        judgeId: judge._id,
        nome: judge.nome,
        enviado: Boolean(score),
        nota: score ? score.nota : null,
        createdAt: score ? score.createdAt : null
      };
    });

    res.status(200).json({
      eventId,
      choreographyId,
      totalJudges: judges.length,
      totalSubmitted: scores.length,
      judges: judgeStatus,
      logs: scoreLogs
    });
  } catch (error) {
    next(error);
  }
}

async function getEventRanking(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const scores = await Score.find({
      eventId,
      ...clientFilter
    }).sort({ createdAt: 1 });

    const groupedScores = new Map();

    scores.forEach((score) => {
      const key = score.choreographyId.toString();
      const entry =
        groupedScores.get(key) ||
        {
          choreographyId: key,
          notas: [],
          totalNotas: 0
        };

      entry.notas.push(score.nota);
      entry.totalNotas += 1;

      groupedScores.set(key, entry);
    });

    const choreographyIds = Array.from(groupedScores.keys());
    const choreographies = choreographyIds.length
      ? await Choreography.find({
          _id: { $in: choreographyIds },
          eventId,
          ...clientFilter
        })
      : [];

    const choreographyMap = new Map(
      choreographies.map((choreography) => [choreography._id.toString(), choreography])
    );

    const ranking = Array.from(groupedScores.values())
      .map((entry) => {
        const choreography = choreographyMap.get(entry.choreographyId);
        const media = entry.notas.reduce((sum, nota) => sum + nota, 0) / entry.totalNotas;

        return {
          choreographyId: entry.choreographyId,
          nome_coreografia: choreography ? choreography.nome_coreografia : "Coreografia removida",
          escola: choreography ? choreography.escola : "-",
          modalidade: choreography ? choreography.modalidade : "-",
          categoria: choreography ? choreography.categoria : "-",
          subcategoria: choreography ? choreography.subcategoria : "-",
          ordem_apresentacao: choreography ? choreography.ordem_apresentacao : null,
          totalNotas: entry.totalNotas,
          media: Number(media.toFixed(2))
        };
      })
      .sort((left, right) => {
        if (right.media !== left.media) {
          return right.media - left.media;
        }

        return (left.ordem_apresentacao || 0) - (right.ordem_apresentacao || 0);
      })
      .map((entry, index) => ({
        colocacao: index + 1,
        ...entry
      }));

    res.status(200).json(ranking);
  } catch (error) {
    next(error);
  }
}

async function getJudgeScoreLogs(req, res, next) {
  try {
    const { token, choreographyId } = req.params;

    const judge = await ensureActiveJudgeByToken(token);

    const logs = await ScoreLog.find({
      judgeId: judge._id,
      choreographyId
    }).sort({ createdAt: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJudgeScore,
  getEventRanking,
  getJudgeScoreLogs,
  listChoreographyScores
};
