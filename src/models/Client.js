const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    nome_empresa: {
      type: String,
      required: true,
      trim: true
    },
    nome_responsavel: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["ativo", "bloqueado", "expirado"],
      default: "ativo"
    },
    plano: {
      type: String,
      trim: true,
      default: "basico"
    },
    limite_eventos: {
      type: Number,
      default: 0
    },
    data_expiracao: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Client", clientSchema);
