const mongoose = require("mongoose");

const scoreLogSchema = new mongoose.Schema(
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
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Judge",
      required: true,
      index: true
    },
    judge_nome: {
      type: String,
      required: true,
      trim: true
    },
    judge_telefone: {
      type: String,
      default: "",
      trim: true
    },
    choreographyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Choreography",
      required: true,
      index: true
    },
    previousNota: {
      type: Number,
      required: true
    },
    newNota: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ScoreLog", scoreLogSchema);
