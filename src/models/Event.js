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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Event", eventSchema);
