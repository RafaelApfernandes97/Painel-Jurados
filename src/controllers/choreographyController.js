const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");
const {
  buildCurrentChoreographyPayload,
  dispatchCurrentChoreography,
  ensureClientEvent,
  loadChoreographyForEvent
} = require("../services/currentChoreographyService");

async function ensureUniqueRegistration(eventId, nInscricao, clientId, choreographyId) {
  const duplicate = await Choreography.findOne({
    eventId,
    clientId,
    n_inscricao: nInscricao,
    ...(choreographyId ? { _id: { $ne: choreographyId } } : {})
  });

  if (duplicate) {
    const error = new Error("n_inscricao already exists for this event");
    error.statusCode = 409;
    throw error;
  }
}

async function createChoreography(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const {
      n_inscricao,
      modalidade,
      categoria,
      subcategoria,
      escola,
      nome_coreografia,
      release,
      elenco,
      ordem_apresentacao
    } = req.body;

    if (
      !n_inscricao ||
      !modalidade ||
      !categoria ||
      !subcategoria ||
      !escola ||
      !nome_coreografia ||
      ordem_apresentacao === undefined
    ) {
      const error = new Error(
        "n_inscricao, modalidade, categoria, subcategoria, escola, nome_coreografia and ordem_apresentacao are required"
      );
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(Number(ordem_apresentacao))) {
      const error = new Error("ordem_apresentacao must be numeric");
      error.statusCode = 400;
      throw error;
    }

    await ensureClientEvent(eventId, clientFilter.clientId);
    await ensureUniqueRegistration(eventId, String(n_inscricao).trim(), clientFilter.clientId);

    const choreography = await Choreography.create({
      clientId: clientFilter.clientId,
      eventId,
      n_inscricao: String(n_inscricao).trim(),
      modalidade,
      categoria,
      subcategoria,
      escola,
      nome_coreografia,
      release,
      elenco,
      ordem_apresentacao: Number(ordem_apresentacao)
    });

    res.status(201).json(choreography);
  } catch (error) {
    next(error);
  }
}

async function listChoreographies(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const choreographies = await Choreography.find({
      eventId,
      ...clientFilter
    }).sort({ ordem_apresentacao: 1, createdAt: 1 });

    res.status(200).json(choreographies);
  } catch (error) {
    next(error);
  }
}

async function updateChoreography(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const existingChoreography = await Choreography.findOne({
      _id: id,
      ...clientFilter
    });

    if (!existingChoreography) {
      const error = new Error("Choreography not found");
      error.statusCode = 404;
      throw error;
    }

    const targetEventId = req.body.eventId || existingChoreography.eventId.toString();

    await ensureClientEvent(targetEventId, clientFilter.clientId);

    if (req.body.n_inscricao !== undefined) {
      await ensureUniqueRegistration(
        targetEventId,
        String(req.body.n_inscricao).trim(),
        clientFilter.clientId,
        existingChoreography._id
      );
      existingChoreography.n_inscricao = String(req.body.n_inscricao).trim();
    }

    if (req.body.ordem_apresentacao !== undefined) {
      if (!Number.isFinite(Number(req.body.ordem_apresentacao))) {
        const error = new Error("ordem_apresentacao must be numeric");
        error.statusCode = 400;
        throw error;
      }

      existingChoreography.ordem_apresentacao = Number(req.body.ordem_apresentacao);
    }

    if (req.body.eventId !== undefined) {
      existingChoreography.eventId = targetEventId;
    }

    const updatableFields = [
      "modalidade",
      "categoria",
      "subcategoria",
      "escola",
      "nome_coreografia",
      "release",
      "elenco",
      "desistencia"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        existingChoreography[field] = req.body[field];
      }
    });

    await existingChoreography.save();

    res.status(200).json(existingChoreography);
  } catch (error) {
    next(error);
  }
}

async function deleteChoreography(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const choreography = await Choreography.findOneAndDelete({
      _id: id,
      ...clientFilter
    });

    if (!choreography) {
      const error = new Error("Choreography not found");
      error.statusCode = 404;
      throw error;
    }

    await Score.deleteMany({
      choreographyId: choreography._id,
      ...clientFilter
    });

    res.status(200).json({
      message: "Choreography deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

async function callChoreography(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const currentChoreography = await dispatchCurrentChoreography({
      eventId,
      choreographyId,
      clientId: clientFilter.clientId
    });

    res.status(200).json({
      message: "Choreography called successfully",
      currentChoreography
    });
  } catch (error) {
    next(error);
  }
}

async function returnChoreographyToQueue(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const event = await ensureClientEvent(eventId, clientFilter.clientId);
    const choreography = await loadChoreographyForEvent({
      eventId,
      choreographyId,
      clientId: clientFilter.clientId
    });

    choreography.presentedAt = null;
    await choreography.save();

    if (event.currentChoreographyId?.toString() === choreography._id.toString()) {
      event.currentChoreographyId = null;
      await event.save();
    }

    res.status(200).json({
      message: "Choreography returned to queue",
      choreography
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentChoreography(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const event = await Event.findOne({
      _id: eventId,
      clientId: clientFilter.clientId
    }).populate("currentChoreographyId");

    if (!event || !event.currentChoreographyId) {
      return res.status(200).json({ currentChoreography: null });
    }

    return res.status(200).json({
      currentChoreography: buildCurrentChoreographyPayload(event.currentChoreographyId)
    });
  } catch (error) {
    next(error);
  }
}

async function importChoreographies(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error("items must be a non-empty array");
      error.statusCode = 400;
      throw error;
    }

    if (items.length > 500) {
      const error = new Error("Maximum 500 items per import");
      error.statusCode = 400;
      throw error;
    }

    await ensureClientEvent(eventId, clientFilter.clientId);

    const requiredFields = ["modalidade", "categoria", "subcategoria", "escola", "nome_coreografia"];
    const errors = [];
    const validated = [];

    // Find the highest existing n_inscricao for this event to auto-generate
    const lastChoreography = await Choreography.findOne({
      eventId,
      clientId: clientFilter.clientId
    }).sort({ n_inscricao: -1 });

    let nextNumber = 1;
    if (lastChoreography) {
      const parsed = parseInt(lastChoreography.n_inscricao, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = i + 1;

      const missing = requiredFields.filter((field) => {
        const value = item[field];
        return value === undefined || value === null || String(value).trim() === "";
      });

      if (missing.length > 0) {
        errors.push({ row, message: `Campos obrigatorios ausentes: ${missing.join(", ")}` });
        continue;
      }

      // Auto-generate n_inscricao if not provided
      let nInscricao;
      if (item.n_inscricao !== undefined && item.n_inscricao !== null && String(item.n_inscricao).trim() !== "") {
        nInscricao = String(item.n_inscricao).trim();
      } else {
        nInscricao = String(nextNumber);
        nextNumber++;
      }

      // Auto-generate ordem_apresentacao if not provided
      const ordemValue = item.ordem_apresentacao !== undefined && item.ordem_apresentacao !== null && String(item.ordem_apresentacao).trim() !== ""
        ? Number(item.ordem_apresentacao)
        : i + 1;

      if (!Number.isFinite(ordemValue)) {
        errors.push({ row, message: "ordem_apresentacao deve ser numerico" });
        continue;
      }

      validated.push({
        clientId: clientFilter.clientId,
        eventId,
        n_inscricao: nInscricao,
        modalidade: String(item.modalidade).trim(),
        categoria: String(item.categoria).trim(),
        subcategoria: String(item.subcategoria).trim(),
        escola: String(item.escola).trim(),
        nome_coreografia: String(item.nome_coreografia).trim(),
        release: item.release ? String(item.release).trim() : "",
        elenco: item.elenco ? String(item.elenco).trim() : "",
        ordem_apresentacao: ordemValue
      });
    }

    let created = [];
    const insertErrors = [];

    for (const item of validated) {
      try {
        const choreography = await Choreography.create(item);
        created.push(choreography);
      } catch (err) {
        const n = item.n_inscricao;
        if (err.code === 11000) {
          insertErrors.push({ n_inscricao: n, message: `Inscricao #${n} ja existe neste evento` });
        } else {
          insertErrors.push({ n_inscricao: n, message: err.message });
        }
      }
    }

    res.status(200).json({
      imported: created.length,
      validationErrors: errors,
      insertErrors,
      total: items.length
    });
  } catch (error) {
    next(error);
  }
}

async function withdrawChoreography(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const choreography = await loadChoreographyForEvent({
      eventId,
      choreographyId,
      clientId: clientFilter.clientId
    });

    choreography.desistencia = true;
    await choreography.save();

    res.status(200).json({
      message: "Choreography marked as withdrawn",
      choreography
    });
  } catch (error) {
    next(error);
  }
}

async function restoreChoreography(req, res, next) {
  try {
    const { eventId, choreographyId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    await ensureClientEvent(eventId, clientFilter.clientId);

    const choreography = await loadChoreographyForEvent({
      eventId,
      choreographyId,
      clientId: clientFilter.clientId
    });

    choreography.desistencia = false;
    await choreography.save();

    res.status(200).json({
      message: "Choreography restored",
      choreography
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  callChoreography,
  createChoreography,
  importChoreographies,
  listChoreographies,
  updateChoreography,
  deleteChoreography,
  getCurrentChoreography,
  returnChoreographyToQueue,
  withdrawChoreography,
  restoreChoreography
};
