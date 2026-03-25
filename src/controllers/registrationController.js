const Choreography = require("../models/Choreography");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { getClientFilter } = require("../services/clientFilterService");

// ── Public: get event info for the registration form ──
async function getPublicEventInfo(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      inscricoes_online: true,
      inscricoes_abertas: true
    }).select(
      "nome local data inscricoes_video_seletiva pricing ecad palcos modalidades categorias subcategorias"
    );

    if (!event) {
      const error = new Error("Inscricoes nao disponiveis para este evento.");
      error.statusCode = 404;
      throw error;
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
}

// ── Public: submit a registration (no auth) ──
async function createPublicRegistration(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      _id: eventId,
      inscricoes_online: true,
      inscricoes_abertas: true
    });

    if (!event) {
      const error = new Error("Inscricoes nao disponiveis para este evento.");
      error.statusCode = 400;
      throw error;
    }

    const { nome_responsavel, email, whatsapp, nome_escola, coreografias } = req.body;

    if (!nome_responsavel || !email || !whatsapp || !nome_escola) {
      const error = new Error("Preencha todos os campos obrigatorios do responsavel.");
      error.statusCode = 400;
      throw error;
    }

    if (!coreografias || !Array.isArray(coreografias) || coreografias.length === 0) {
      const error = new Error("Adicione pelo menos uma coreografia.");
      error.statusCode = 400;
      throw error;
    }

    // Validar campos obrigatórios de cada coreografia
    for (let i = 0; i < coreografias.length; i++) {
      const c = coreografias[i];
      if (!c.nome_coreografia || !c.modalidade || !c.categoria || !c.subcategoria || !c.quantidade_bailarinos) {
        const error = new Error(
          `Coreografia ${i + 1}: preencha todos os campos obrigatorios (nome, modalidade, categoria, subcategoria, quantidade de bailarinos).`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Preparar itens de coreografia
    const coreografiasData = coreografias.map((c) => ({
      nome_coreografia: c.nome_coreografia,
      modalidade: c.modalidade,
      categoria: c.categoria,
      subcategoria: c.subcategoria,
      quantidade_bailarinos: c.quantidade_bailarinos,
      release: c.release || "",
      musica: c.musica || "",
      tempo_apresentacao: c.tempo_apresentacao || "",
      coreografo: c.coreografo || "",
      elenco: c.elenco || "",
      video_url: c.video_url || "",
      status_video:
        event.inscricoes_video_seletiva && c.video_url ? "pendente" : "nao_aplicavel"
    }));

    const registration = new Registration({
      clientId: event.clientId,
      eventId: event._id,
      nome_responsavel,
      email,
      whatsapp,
      nome_escola,
      coreografias: coreografiasData
    });

    // Auto-calcular valor
    registration.calcularValor(event.pricing, event.ecad);

    await registration.save();

    res.status(201).json({
      message: "Inscricao realizada com sucesso!",
      registration: {
        _id: registration._id,
        nome_escola: registration.nome_escola,
        total_coreografias: registration.coreografias.length,
        valor_total: registration.valor_total,
        status_inscricao: registration.status_inscricao
      }
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin: list registrations for an event ──
async function listRegistrations(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registrations = await Registration.find({
      eventId,
      ...clientFilter
    }).sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    next(error);
  }
}

// ── Admin: update registration ──
async function updateRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const {
      status_pagamento,
      status_inscricao,
      observacoes,
      valor_desconto
    } = req.body;

    const registration = await Registration.findOne({ _id: id, ...clientFilter });

    if (!registration) {
      const error = new Error("Inscricao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    if (status_pagamento !== undefined) registration.status_pagamento = status_pagamento;
    if (status_inscricao !== undefined) registration.status_inscricao = status_inscricao;
    if (observacoes !== undefined) registration.observacoes = observacoes;

    if (valor_desconto !== undefined) {
      registration.valor_desconto = valor_desconto;
      // Recalcular total com desconto
      const event = await Event.findById(registration.eventId);
      if (event) {
        registration.calcularValor(event.pricing, event.ecad);
      }
    }

    await registration.save();

    res.json(registration);
  } catch (error) {
    next(error);
  }
}

// ── Admin: update video status for a specific choreography item ──
async function updateCoreografiaVideo(req, res, next) {
  try {
    const { id, coreografiaId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const { status_video } = req.body;

    const registration = await Registration.findOne({ _id: id, ...clientFilter });

    if (!registration) {
      const error = new Error("Inscricao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const coreo = registration.coreografias.id(coreografiaId);

    if (!coreo) {
      const error = new Error("Coreografia nao encontrada na inscricao.");
      error.statusCode = 404;
      throw error;
    }

    if (status_video !== undefined) coreo.status_video = status_video;

    await registration.save();

    res.json(registration);
  } catch (error) {
    next(error);
  }
}

// ── Admin: delete registration ──
async function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registration = await Registration.findOneAndDelete({ _id: id, ...clientFilter });

    if (!registration) {
      const error = new Error("Inscricao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Remover coreografias vinculadas
    const choreographyIds = (registration.coreografias || [])
      .map((c) => c.choreographyId)
      .filter(Boolean);

    if (choreographyIds.length > 0) {
      await Choreography.deleteMany({ _id: { $in: choreographyIds } });
    }

    res.json({ message: "Inscricao excluida com sucesso." });
  } catch (error) {
    next(error);
  }
}

// ── Admin: approve and convert all choreographies ──
async function approveAndConvert(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registration = await Registration.findOne({ _id: id, ...clientFilter });

    if (!registration) {
      const error = new Error("Inscricao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Verificar se já tem alguma coreografia convertida
    const alreadyConverted = registration.coreografias.some((c) => c.choreographyId);
    if (alreadyConverted) {
      const error = new Error("Esta inscricao ja possui coreografias convertidas.");
      error.statusCode = 400;
      throw error;
    }

    // Buscar último número de inscrição e ordem
    const lastChoreography = await Choreography.findOne({ eventId: registration.eventId })
      .sort({ ordem_apresentacao: -1 })
      .select("ordem_apresentacao");

    let nextOrdem = lastChoreography ? lastChoreography.ordem_apresentacao + 1 : 1;
    const createdChoreographies = [];

    for (const coreo of registration.coreografias) {
      const choreography = await Choreography.create({
        clientId: registration.clientId,
        eventId: registration.eventId,
        n_inscricao: String(nextOrdem),
        nome_coreografia: coreo.nome_coreografia,
        modalidade: coreo.modalidade,
        categoria: coreo.categoria,
        subcategoria: coreo.subcategoria,
        escola: registration.nome_escola,
        release: coreo.release,
        elenco: coreo.elenco,
        quantidade_bailarinos: coreo.quantidade_bailarinos,
        tempo_apresentacao: coreo.tempo_apresentacao,
        musica: coreo.musica,
        coreografo: coreo.coreografo,
        palco: coreo.palco || "",
        ordem_apresentacao: nextOrdem
      });

      coreo.choreographyId = choreography._id;
      createdChoreographies.push(choreography);
      nextOrdem++;
    }

    registration.status_inscricao = "aprovada";
    await registration.save();

    res.json({
      message: `${createdChoreographies.length} coreografia(s) criada(s) com sucesso.`,
      registration,
      choreographies: createdChoreographies
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicEventInfo,
  createPublicRegistration,
  listRegistrations,
  updateRegistration,
  updateCoreografiaVideo,
  deleteRegistration,
  approveAndConvert
};
