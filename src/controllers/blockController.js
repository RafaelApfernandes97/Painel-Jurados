const Block = require("../models/Block");
const Choreography = require("../models/Choreography");
const { getClientFilter } = require("../services/clientFilterService");

async function createBlock(req, res, next) {
  try {
    const { eventId } = req.params;
    const { nome, ordem, palco } = req.body;
    const clientFilter = req.clientFilter || getClientFilter(req);

    if (!nome || ordem === undefined) {
      const error = new Error("nome and ordem are required");
      error.statusCode = 400;
      throw error;
    }

    const block = await Block.create({
      clientId: clientFilter.clientId,
      eventId,
      nome,
      ordem: Number(ordem),
      palco: palco || ""
    });

    res.status(201).json(block);
  } catch (error) {
    next(error);
  }
}

async function listBlocks(req, res, next) {
  try {
    const { eventId } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const blocks = await Block.find({
      eventId,
      ...clientFilter
    }).sort({ ordem: 1, createdAt: 1 });

    res.status(200).json(blocks);
  } catch (error) {
    next(error);
  }
}

async function updateBlock(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const block = await Block.findOne({ _id: id, ...clientFilter });

    if (!block) {
      const error = new Error("Block not found");
      error.statusCode = 404;
      throw error;
    }

    if (req.body.nome !== undefined) {
      block.nome = req.body.nome;
    }

    if (req.body.ordem !== undefined) {
      block.ordem = Number(req.body.ordem);
    }

    if (req.body.palco !== undefined) {
      block.palco = req.body.palco;
    }

    await block.save();

    res.status(200).json(block);
  } catch (error) {
    next(error);
  }
}

async function deleteBlock(req, res, next) {
  try {
    const { id } = req.params;
    const clientFilter = req.clientFilter || getClientFilter(req);

    const block = await Block.findOneAndDelete({ _id: id, ...clientFilter });

    if (!block) {
      const error = new Error("Block not found");
      error.statusCode = 404;
      throw error;
    }

    await Choreography.updateMany(
      { blockId: block._id, ...clientFilter },
      { $set: { blockId: null } }
    );

    res.status(200).json({ message: "Block deleted successfully" });
  } catch (error) {
    next(error);
  }
}

async function assignChoreographies(req, res, next) {
  try {
    const { eventId, id } = req.params;
    const { choreographyIds } = req.body;
    const clientFilter = req.clientFilter || getClientFilter(req);

    if (!Array.isArray(choreographyIds)) {
      const error = new Error("choreographyIds must be an array");
      error.statusCode = 400;
      throw error;
    }

    const block = await Block.findOne({ _id: id, eventId, ...clientFilter });

    if (!block) {
      const error = new Error("Block not found");
      error.statusCode = 404;
      throw error;
    }

    await Choreography.updateMany(
      { blockId: block._id, eventId, ...clientFilter },
      { $set: { blockId: null } }
    );

    if (choreographyIds.length > 0) {
      await Choreography.updateMany(
        { _id: { $in: choreographyIds }, eventId, ...clientFilter },
        { $set: { blockId: block._id } }
      );
    }

    const choreographies = await Choreography.find({
      eventId,
      ...clientFilter
    }).sort({ ordem_apresentacao: 1 });

    res.status(200).json({ block, choreographies });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBlock,
  listBlocks,
  updateBlock,
  deleteBlock,
  assignChoreographies
};
