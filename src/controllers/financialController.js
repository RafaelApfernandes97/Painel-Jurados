const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { getClientFilter } = require("../services/clientFilterService");

// ── Resumo financeiro geral do evento ──
async function getEventFinancialSummary(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registrations = await Registration.find({ eventId, ...clientFilter });

    const summary = {
      total_inscricoes: registrations.length,
      total_coreografias: 0,
      total_bailarinos: 0,
      receita_total: 0,
      total_pago: 0,
      total_pendente: 0,
      total_isentos: 0,
      por_status: {
        pendente: 0,
        parcial: 0,
        pago: 0,
        isento: 0
      }
    };

    for (const reg of registrations) {
      summary.total_coreografias += (reg.coreografias || []).length;
      summary.total_bailarinos += (reg.coreografias || []).reduce(
        (sum, c) => sum + (c.quantidade_bailarinos || 0),
        0
      );
      summary.receita_total += reg.valor_total || 0;
      summary.total_pago += reg.valor_pago || 0;

      if (reg.status_pagamento === "isento") {
        summary.total_isentos += reg.valor_total || 0;
      }

      summary.por_status[reg.status_pagamento] =
        (summary.por_status[reg.status_pagamento] || 0) + 1;
    }

    summary.total_pendente = summary.receita_total - summary.total_pago - summary.total_isentos;

    res.json(summary);
  } catch (error) {
    next(error);
  }
}

// ── Visão financeira por escola ──
async function getFinancialBySchool(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registrations = await Registration.find({ eventId, ...clientFilter });

    const schoolMap = {};

    for (const reg of registrations) {
      const escola = reg.nome_escola || "Sem escola";

      if (!schoolMap[escola]) {
        schoolMap[escola] = {
          nome_escola: escola,
          total_inscricoes: 0,
          total_coreografias: 0,
          total_bailarinos: 0,
          valor_total: 0,
          valor_pago: 0,
          valor_pendente: 0
        };
      }

      const s = schoolMap[escola];
      s.total_inscricoes += 1;
      s.total_coreografias += (reg.coreografias || []).length;
      s.total_bailarinos += (reg.coreografias || []).reduce(
        (sum, c) => sum + (c.quantidade_bailarinos || 0),
        0
      );
      s.valor_total += reg.valor_total || 0;
      s.valor_pago += reg.valor_pago || 0;
      s.valor_pendente += Math.max(0, (reg.valor_total || 0) - (reg.valor_pago || 0));
    }

    const schools = Object.values(schoolMap).sort((a, b) =>
      a.nome_escola.localeCompare(b.nome_escola)
    );

    res.json(schools);
  } catch (error) {
    next(error);
  }
}

// ── Lista detalhada de inscrições com valores ──
async function getFinancialDetails(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const registrations = await Registration.find({ eventId, ...clientFilter })
      .sort({ createdAt: -1 });

    const details = registrations.map((reg) => ({
      _id: reg._id,
      nome_escola: reg.nome_escola,
      nome_responsavel: reg.nome_responsavel,
      email: reg.email,
      total_coreografias: (reg.coreografias || []).length,
      total_bailarinos: (reg.coreografias || []).reduce(
        (sum, c) => sum + (c.quantidade_bailarinos || 0),
        0
      ),
      valor_subtotal: reg.valor_subtotal,
      valor_taxas: reg.valor_taxas,
      valor_desconto: reg.valor_desconto,
      valor_total: reg.valor_total,
      valor_pago: reg.valor_pago,
      valor_pendente: Math.max(0, (reg.valor_total || 0) - (reg.valor_pago || 0)),
      status_pagamento: reg.status_pagamento,
      status_inscricao: reg.status_inscricao,
      pagamentos: reg.pagamentos,
      createdAt: reg.createdAt
    }));

    res.json(details);
  } catch (error) {
    next(error);
  }
}

// ── Registrar pagamento manual ──
async function registerPayment(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);
    const { valor, metodo, comprovante_url, observacao } = req.body;

    if (!valor || valor <= 0) {
      const error = new Error("Valor do pagamento deve ser maior que zero.");
      error.statusCode = 400;
      throw error;
    }

    if (!metodo) {
      const error = new Error("Metodo de pagamento e obrigatorio.");
      error.statusCode = 400;
      throw error;
    }

    const registration = await Registration.findOne({ _id: id, ...clientFilter });

    if (!registration) {
      const error = new Error("Inscricao nao encontrada.");
      error.statusCode = 404;
      throw error;
    }

    registration.pagamentos.push({
      valor,
      data: new Date(),
      metodo,
      comprovante_url: comprovante_url || "",
      observacao: observacao || ""
    });

    registration.valor_pago = registration.pagamentos.reduce(
      (sum, p) => sum + (p.valor || 0),
      0
    );

    // Atualizar status de pagamento automaticamente
    if (registration.valor_pago >= registration.valor_total) {
      registration.status_pagamento = "pago";
    } else if (registration.valor_pago > 0) {
      registration.status_pagamento = "parcial";
    }

    await registration.save();

    res.json({
      message: "Pagamento registrado com sucesso.",
      registration
    });
  } catch (error) {
    next(error);
  }
}

// ── Público: calcular valor de uma inscrição (preview) ──
async function calculateRegistrationValue(req, res, next) {
  try {
    const { eventId } = req.params;
    const { coreografias } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      const error = new Error("Evento nao encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const pricing = event.pricing || {};
    const ecad = event.ecad || {};

    const taxaBase = pricing.taxa_inscricao_base || 0;
    let subtotal = taxaBase;
    const itens = [];

    for (const coreo of coreografias || []) {
      let valorCoreo = pricing.valor_por_coreografia || 0;
      valorCoreo += (pricing.valor_por_bailarino || 0) * (coreo.quantidade_bailarinos || 0);
      itens.push({
        nome_coreografia: coreo.nome_coreografia || "",
        quantidade_bailarinos: coreo.quantidade_bailarinos || 0,
        valor: valorCoreo
      });
      subtotal += valorCoreo;
    }

    // ECAD
    let valorEcad = 0;
    if (ecad.habilitado) {
      valorEcad = (coreografias || []).length * (ecad.valor_padrao || 0);
    }

    // Taxas adicionais
    let valorTaxasAdicionais = 0;
    for (const taxa of pricing.taxas_adicionais || []) {
      if (taxa.tipo === "fixo") {
        valorTaxasAdicionais += taxa.valor || 0;
      } else if (taxa.tipo === "percentual") {
        valorTaxasAdicionais += subtotal * ((taxa.valor || 0) / 100);
      }
    }

    const valorTaxas = valorEcad + valorTaxasAdicionais;
    const valorTotal = subtotal + valorTaxas;

    res.json({
      itens,
      taxa_base: taxaBase,
      subtotal,
      ecad: valorEcad,
      taxas_adicionais: valorTaxasAdicionais,
      valor_taxas: valorTaxas,
      valor_total: valorTotal
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEventFinancialSummary,
  getFinancialBySchool,
  getFinancialDetails,
  registerPayment,
  calculateRegistrationValue
};
