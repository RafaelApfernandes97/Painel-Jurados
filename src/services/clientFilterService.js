function getClientFilter(req) {
  return {
    clientId: req.user.clientId
  };
}

module.exports = {
  getClientFilter
};
