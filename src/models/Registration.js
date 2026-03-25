const mongoose = require("mongoose");

// ── Sub-schema: cada coreografia dentro de uma inscrição ──
const coreografiaItemSchema = new mongoose.Schema(
  {
    nome_coreografia: { type: String, required: true, trim: true },
    modalidade: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    subcategoria: { type: String, required: true, trim: true },
    quantidade_bailarinos: { type: Number, required: true, min: 1 },
    release: { type: String, default: "", trim: true },
    musica: { type: String, default: "", trim: true },
    tempo_apresentacao: { type: String, default: "", trim: true },
    coreografo: { type: String, default: "", trim: true },
    elenco: { type: String, default: "", trim: true },
    video_url: { type: String, default: "", trim: true },
    status_video: {
      type: String,
      enum: ["nao_aplicavel", "pendente", "aprovado", "reprovado"],
      default: "nao_aplicavel"
    },
    valor_calculado: { type: Number, default: 0 },
    choreographyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Choreography",
      default: null
    }
  },
  { _id: true }
);

// ── Sub-schema: registro de pagamento ──
const pagamentoSchema = new mongoose.Schema(
  {
    valor: { type: Number, required: true },
    data: { type: Date, default: Date.now },
    metodo: {
      type: String,
      enum: ["pix", "transferencia", "dinheiro", "cartao", "outro"],
      required: true
    },
    comprovante_url: { type: String, default: "", trim: true },
    observacao: { type: String, default: "", trim: true }
  },
  { _id: true }
);

// ── Schema principal da Inscrição ──
const registrationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true
    },

    // Dados do responsável
    nome_responsavel: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, required: true, trim: true },

    // Escola / grupo
    nome_escola: { type: String, required: true, trim: true },

    // Coreografias (1 ou mais)
    coreografias: {
      type: [coreografiaItemSchema],
      validate: [arr => arr.length > 0, "Pelo menos uma coreografia é obrigatória"]
    },

    // ── Financeiro ──
    valor_subtotal: { type: Number, default: 0 },
    valor_taxas: { type: Number, default: 0 },
    valor_desconto: { type: Number, default: 0 },
    valor_total: { type: Number, default: 0 },
    valor_pago: { type: Number, default: 0 },
    pagamentos: [pagamentoSchema],

    status_pagamento: {
      type: String,
      enum: ["pendente", "parcial", "pago", "isento"],
      default: "pendente"
    },
    status_inscricao: {
      type: String,
      enum: ["pendente", "aprovada", "reprovada"],
      default: "pendente"
    },
    observacoes: { type: String, default: "", trim: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ── Virtuals ──
registrationSchema.virtual("valor_pendente").get(function () {
  return Math.max(0, this.valor_total - this.valor_pago);
});

registrationSchema.virtual("total_bailarinos").get(function () {
  return (this.coreografias || []).reduce(
    (sum, c) => sum + (c.quantidade_bailarinos || 0),
    0
  );
});

// ── Método: calcular valor total baseado no pricing do evento ──
registrationSchema.methods.calcularValor = function (eventPricing, eventEcad) {
  const pricing = eventPricing || {};
  const ecad = eventEcad || {};

  let subtotal = 0;
  const taxaBase = pricing.taxa_inscricao_base || 0;

  for (const coreo of this.coreografias) {
    let valorCoreo = pricing.valor_por_coreografia || 0;
    valorCoreo += (pricing.valor_por_bailarino || 0) * (coreo.quantidade_bailarinos || 0);
    coreo.valor_calculado = valorCoreo;
    subtotal += valorCoreo;
  }

  subtotal += taxaBase;

  // ECAD
  let valorEcad = 0;
  if (ecad.habilitado) {
    const qtdCoreos = this.coreografias.length;
    valorEcad = qtdCoreos * (ecad.valor_padrao || 0);
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

  this.valor_subtotal = subtotal;
  this.valor_taxas = valorEcad + valorTaxasAdicionais;
  this.valor_total = subtotal + this.valor_taxas - (this.valor_desconto || 0);

  return this.valor_total;
};

// ── Índices ──
registrationSchema.index({ eventId: 1, email: 1 });
registrationSchema.index({ eventId: 1, nome_escola: 1 });

module.exports = mongoose.model("Registration", registrationSchema);
