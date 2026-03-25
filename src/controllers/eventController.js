const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Judge = require("../models/Judge");
const Registration = require("../models/Registration");
const Score = require("../models/Score");
const { getClientFilter } = require("../services/clientFilterService");

async function createEvent(req, res, next) {
  try {
    const {
      nome, local, data, status,
      inscricoes_online, inscricoes_video_seletiva, inscricoes_abertas,
      pricing, ecad, palcos, modalidades, categorias, subcategorias
    } = req.body;

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
      status: status || "ativo",
      inscricoes_online: inscricoes_online || false,
      inscricoes_video_seletiva: inscricoes_video_seletiva || false,
      inscricoes_abertas: inscricoes_abertas || false,
      pricing: pricing || {},
      ecad: ecad || {},
      palcos: palcos || [],
      modalidades: modalidades || [],
      categorias: categorias || [],
      subcategorias: subcategorias || []
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
    const {
      nome, local, data, status,
      inscricoes_online, inscricoes_video_seletiva, inscricoes_abertas,
      pricing, ecad, palcos, modalidades, categorias, subcategorias
    } = req.body;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const updatePayload = {};

    if (nome !== undefined) updatePayload.nome = nome;
    if (local !== undefined) updatePayload.local = local;
    if (data !== undefined) updatePayload.data = data;
    if (status !== undefined) updatePayload.status = status;
    if (inscricoes_online !== undefined) updatePayload.inscricoes_online = inscricoes_online;
    if (inscricoes_video_seletiva !== undefined) updatePayload.inscricoes_video_seletiva = inscricoes_video_seletiva;
    if (inscricoes_abertas !== undefined) updatePayload.inscricoes_abertas = inscricoes_abertas;
    if (pricing !== undefined) updatePayload.pricing = pricing;
    if (ecad !== undefined) updatePayload.ecad = ecad;
    if (palcos !== undefined) updatePayload.palcos = palcos;
    if (modalidades !== undefined) updatePayload.modalidades = modalidades;
    if (categorias !== undefined) updatePayload.categorias = categorias;
    if (subcategorias !== undefined) updatePayload.subcategorias = subcategorias;

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

// ── Dashboard avançado por evento ──
async function getEventDashboard(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const [event, choreographies, judges, registrations] = await Promise.all([
      Event.findOne({ _id: eventId, ...clientFilter }),
      Choreography.find({ eventId, ...clientFilter }),
      Judge.find({ eventId, ...clientFilter }),
      Registration.find({ eventId, ...clientFilter })
    ]);

    if (!event) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    // Contar escolas distintas
    const escolasSet = new Set();
    let totalBailarinos = 0;
    let totalCoreografiasInscritas = 0;

    for (const reg of registrations) {
      escolasSet.add(reg.nome_escola);
      for (const c of reg.coreografias || []) {
        totalBailarinos += c.quantidade_bailarinos || 0;
        totalCoreografiasInscritas++;
      }
    }

    // Financeiro resumido
    let receitaTotal = 0;
    let totalPago = 0;

    for (const reg of registrations) {
      receitaTotal += reg.valor_total || 0;
      totalPago += reg.valor_pago || 0;
    }

    // Coreografias por status
    const apresentadas = choreographies.filter((c) => c.presentedAt).length;
    const desistencias = choreographies.filter((c) => c.desistencia).length;
    const aguardando = choreographies.length - apresentadas - desistencias;

    res.json({
      evento: {
        nome: event.nome,
        local: event.local,
        data: event.data,
        status: event.status
      },
      metricas: {
        total_escolas: escolasSet.size,
        total_bailarinos: totalBailarinos,
        total_coreografias: choreographies.length,
        total_coreografias_inscritas: totalCoreografiasInscritas,
        total_inscricoes: registrations.length,
        total_jurados: judges.length,
        jurados_ativos: judges.filter((j) => j.ativo).length
      },
      coreografias_status: {
        aguardando,
        apresentadas,
        desistencias
      },
      financeiro: {
        receita_total: receitaTotal,
        total_pago: totalPago,
        total_pendente: receitaTotal - totalPago
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  getEventDashboard
};
