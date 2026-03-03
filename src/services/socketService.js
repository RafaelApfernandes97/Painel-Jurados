let ioInstance;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  if (!ioInstance) {
    throw new Error("Socket.IO server is not initialized");
  }

  return ioInstance;
}

function getEventRoom(eventId) {
  return `event:${eventId}`;
}

function emitCurrentChoreography(eventId, payload) {
  getIo().to(getEventRoom(eventId)).emit("CURRENT_CHOREOGRAPHY", payload);
}

function emitJudgeScored(eventId, payload) {
  getIo().to(getEventRoom(eventId)).emit("JUDGE_SCORED", payload);
}

module.exports = {
  setIo,
  getIo,
  getEventRoom,
  emitCurrentChoreography,
  emitJudgeScored
};
