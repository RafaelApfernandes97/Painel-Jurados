const mongoose = require("mongoose");

function hasAtMostTwoDecimals(value) {
  return /^\d+(\.\d{1,2})?$/.test(String(value));
}

const scoreSchema = new mongoose.Schema(
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
    choreographyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Choreography",
      required: true,
      index: true
    },
    nota: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      validate: {
        validator: hasAtMostTwoDecimals,
        message: "nota must have at most 2 decimal places"
      }
    }
  },
  {
    timestamps: true
  }
);

scoreSchema.index({ judgeId: 1, choreographyId: 1 }, { unique: true });

module.exports = mongoose.model("Score", scoreSchema);
