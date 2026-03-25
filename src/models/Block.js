const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
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
    ordem: {
      type: Number,
      required: true
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

blockSchema.index({ eventId: 1, ordem: 1 });

module.exports = mongoose.model("Block", blockSchema);
