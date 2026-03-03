const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Judge = require("../models/Judge");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");

async function createEvent(req, res, next) {
  try {
    const { nome, local, data, status } = req.body;

    if (!nome || !local || !data) {
      const error = new Error("nome, local and data are required");
      error.statusCode = 400;
      throw error;
    }

    const clientFilter = req.clientFilter || getClientFilter(req);

    const event = await Event.create({
      clientId: clientFilter.clientId,
      nome,
      local,
      data,
      status: status || "ativo"
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
}

async function listEvents(req, res, next) {
  try {
    const clientFilter = req.clientFilter || getClientFilter(req);
    const events = await Event.find(clientFilter).sort({ data: 1, createdAt: -1 });

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, local, data, status } = req.body;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const updatePayload = {};

    if (nome !== undefined) {
      updatePayload.nome = nome;
    }

    if (local !== undefined) {
      updatePayload.local = local;
    }

    if (data !== undefined) {
      updatePayload.data = data;
    }

    if (status !== undefined) {
      updatePayload.status = status;
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: id,
        ...clientFilter
      },
      updatePayload,
      {
        new: true,
        runValidators: true
      }
    );

    if (!event) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const event = await Event.findOneAndDelete({
      _id: id,
      ...clientFilter
    });

    if (!event) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    await Choreography.deleteMany({
      eventId: event._id,
      ...clientFilter
    });

    await Judge.deleteMany({
      eventId: event._id,
      ...clientFilter
    });

    await Score.deleteMany({
      eventId: event._id,
      ...clientFilter
    });

    res.status(200).json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent
};
