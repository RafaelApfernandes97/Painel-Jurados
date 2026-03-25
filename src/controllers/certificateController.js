const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");

// ── Listar coreografias elegíveis para certificado ──
async function listCertificates(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const [event, choreographies] = await Promise.all([
      Event.findOne({ _id: eventId, ...clientFilter }),
      Choreography.find({
        eventId,
        ...clientFilter,
        presentedAt: { $ne: null },
        desistencia: false
      }).sort({ ordem_apresentacao: 1 })
    ]);

    if (!event) {
      const error = new Error("Evento nao encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Buscar scores para calcular colocação
    const scores = await Score.find({ eventId, ...clientFilter });

    const scoresByChoreography = {};
    for (const s of scores) {
      const key = s.choreographyId.toString();
      if (!scoresByChoreography[key]) scoresByChoreography[key] = [];
      scoresByChoreography[key].push(s.nota);
    }

    const certificates = choreographies.map((c) => {
      const notasArr = scoresByChoreography[c._id.toString()] || [];
      const media = notasArr.length > 0
        ? notasArr.reduce((sum, n) => sum + n, 0) / notasArr.length
        : 0;

      return {
        _id: c._id,
        n_inscricao: c.n_inscricao,
        nome_coreografia: c.nome_coreografia,
        escola: c.escola,
        modalidade: c.modalidade,
        categoria: c.categoria,
        subcategoria: c.subcategoria,
        quantidade_bailarinos: c.quantidade_bailarinos,
        palco: c.palco,
        presentedAt: c.presentedAt,
        media: Math.round(media * 100) / 100,
        total_notas: notasArr.length
      };
    });

    // Ordenar por média para definir colocação
    certificates.sort((a, b) => b.media - a.media);
    certificates.forEach((cert, i) => {
      cert.colocacao = i + 1;
    });

    res.json({
      evento: {
        nome: event.nome,
        local: event.local,
        data: event.data
      },
      certificates
    });
  } catch (error) {
    next(error);
  }
}

// ── Gerar dados de um certificado individual ──
async function getCertificate(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const [event, choreography] = await Promise.all([
      Event.findOne({ _id: eventId, ...clientFilter }),
      Choreography.findOne({ _id: choreographyId, eventId, ...clientFilter })
    ]);

    if (!event || !choreography) {
      const error = new Error("Evento ou coreografia nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const scores = await Score.find({
      eventId,
      choreographyId,
      ...clientFilter
    });

    const media = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.nota, 0) / scores.length
      : 0;

    // Calcular colocação
    const allScores = await Score.find({ eventId, ...clientFilter });
    const scoresByChoreography = {};
    for (const s of allScores) {
      const key = s.choreographyId.toString();
      if (!scoresByChoreography[key]) scoresByChoreography[key] = [];
      scoresByChoreography[key].push(s.nota);
    }

    const allChoreographies = await Choreography.find({
      eventId,
      ...clientFilter,
      presentedAt: { $ne: null },
      desistencia: false
    });

    const ranking = allChoreographies.map((c) => {
      const notasArr = scoresByChoreography[c._id.toString()] || [];
      const avg = notasArr.length > 0
        ? notasArr.reduce((sum, n) => sum + n, 0) / notasArr.length
        : 0;
      return { id: c._id.toString(), media: avg };
    });

    ranking.sort((a, b) => b.media - a.media);
    const position = ranking.findIndex((r) => r.id === choreographyId) + 1;

    res.json({
      evento: {
        nome: event.nome,
        local: event.local,
        data: event.data
      },
      certificado: {
        nome_coreografia: choreography.nome_coreografia,
        escola: choreography.escola,
        modalidade: choreography.modalidade,
        categoria: choreography.categoria,
        subcategoria: choreography.subcategoria,
        quantidade_bailarinos: choreography.quantidade_bailarinos,
        elenco: choreography.elenco,
        palco: choreography.palco,
        media: Math.round(media * 100) / 100,
        colocacao: position,
        total_participantes: ranking.length,
        presentedAt: choreography.presentedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCertificates,
  getCertificate
};
