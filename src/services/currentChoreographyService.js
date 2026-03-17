const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const { emitCurrentChoreography } = require("./socketService");

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

async function loadChoreographyForEvent({ eventId, choreographyId, clientId }) {
  const choreography = await Choreography.findOne({
    _id: choreographyId,
    eventId,
    clientId
  });

  if (!choreography) {
    const error = new Error("Choreography not found");
    error.statusCode = 404;
    throw error;
  }

  return choreography;
}

function buildCurrentChoreographyPayload(choreography) {
  return {
    id: choreography._id,
    eventId: choreography.eventId,
    clientId: choreography.clientId,
    n_inscricao: choreography.n_inscricao,
    modalidade: choreography.modalidade,
    categoria: choreography.categoria,
    subcategoria: choreography.subcategoria,
    escola: choreography.escola,
    nome_coreografia: choreography.nome_coreografia,
    release: choreography.release,
    elenco: choreography.elenco,
    ordem_apresentacao: choreography.ordem_apresentacao,
    desistencia: choreography.desistencia || false,
    blockId: choreography.blockId || null
  };
}

async function dispatchCurrentChoreography({ eventId, choreographyId, clientId }) {
  const event = await ensureClientEvent(eventId, clientId);

  const choreography = await loadChoreographyForEvent({
    eventId,
    choreographyId,
    clientId
  });

  if (!choreography.presentedAt) {
    choreography.presentedAt = new Date();
    await choreography.save();
  }

  event.currentChoreographyId = choreography._id;
  await event.save();

  const payload = buildCurrentChoreographyPayload(choreography);
  emitCurrentChoreography(eventId, payload);

  return payload;
}

module.exports = {
  ensureClientEvent,
  loadChoreographyForEvent,
  buildCurrentChoreographyPayload,
  dispatchCurrentChoreography
};
