const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },
    nome: {
      type: String,
      required: true,
      trim: true
    },
    local: {
      type: String,
      required: true,
      trim: true
    },
    data: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      trim: true,
      default: "ativo"
    },
    currentChoreographyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Choreography",
      default: null
    },
    inscricoes_online: {
      type: Boolean,
      default: false
    },
    inscricoes_video_seletiva: {
      type: Boolean,
      default: false
    },
    inscricoes_abertas: {
      type: Boolean,
      default: false
    },

    // ── Configuração de Preços ──
    pricing: {
      valor_por_coreografia: { type: Number, default: 0 },
      valor_por_bailarino: { type: Number, default: 0 },
      taxa_inscricao_base: { type: Number, default: 0 },
      taxas_adicionais: [
        {
          nome: { type: String, trim: true },
          tipo: { type: String, enum: ["fixo", "percentual"] },
          valor: { type: Number, default: 0 }
        }
      ]
    },

    // ── Tabela ECAD configurável ──
    ecad: {
      habilitado: { type: Boolean, default: false },
      tabela: [
        {
          descricao: { type: String, trim: true },
          tipo_musica: { type: String, trim: true },
          tipo_local: { type: String, trim: true },
          valor: { type: Number, default: 0 }
        }
      ],
      valor_padrao: { type: Number, default: 0 }
    },

    // ── Palcos dinâmicos (sub-eventos) ──
    palcos: [
      {
        nome: { type: String, required: true, trim: true },
        descricao: { type: String, default: "", trim: true }
      }
    ],

    // ── Opções para formulário de inscrição ──
    modalidades: [{ type: String, trim: true }],
    categorias: [{ type: String, trim: true }],
    subcategorias: [{ type: String, trim: true }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Event", eventSchema);
