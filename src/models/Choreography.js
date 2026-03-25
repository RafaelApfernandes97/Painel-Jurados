const mongoose = require("mongoose");

const choreographySchema = new mongoose.Schema(
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
    n_inscricao: {
      type: String,
      required: true,
      trim: true
    },
    modalidade: {
      type: String,
      required: true,
      trim: true
    },
    categoria: {
      type: String,
      required: true,
      trim: true
    },
    subcategoria: {
      type: String,
      required: true,
      trim: true
    },
    escola: {
      type: String,
      required: true,
      trim: true
    },
    nome_coreografia: {
      type: String,
      required: true,
      trim: true
    },
    release: {
      type: String,
      default: "",
      trim: true
    },
    elenco: {
      type: String,
      default: "",
      trim: true
    },
    ordem_apresentacao: {
      type: Number,
      required: true
    },
    presentedAt: {
      type: Date,
      default: null
    },
    quantidade_bailarinos: {
      type: Number,
      default: 0
    },
    tempo_apresentacao: {
      type: String,
      default: "",
      trim: true
    },
    musica: {
      type: String,
      default: "",
      trim: true
    },
    coreografo: {
      type: String,
      default: "",
      trim: true
    },
    palco: {
      type: String,
      default: "",
      trim: true
    },
    horario_previsto: {
      type: Date,
      default: null
    },
    status_cronograma: {
      type: String,
      enum: ["aguardando", "confirmado", "primeira_chamada", "no_palco", "apresentado", "desistencia"],
      default: "aguardando"
    },
    desistencia: {
      type: Boolean,
      default: false
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      default: null
    }
  },
  {
    timestamps: true
  }
);

choreographySchema.index({ eventId: 1, n_inscricao: 1 }, { unique: true });

module.exports = mongoose.model("Choreography", choreographySchema);
