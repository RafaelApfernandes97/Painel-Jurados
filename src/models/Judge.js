const mongoose = require("mongoose");

const judgeSchema = new mongoose.Schema(
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
    nome: {
      type: String,
      required: true,
      trim: true
    },
    telefone: {
      type: String,
      required: true,
      trim: true
    },
    token_acesso: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ativo: {
      type: Boolean,
      default: true
    },
    palco: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Judge", judgeSchema);
