const { getClientFilter } = require("../services/clientFilterService");

function clientIsolationMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  if (!req.user.clientId) {
    return res.status(403).json({
      message: "Client context not available"
    });
  }

  req.clientFilter = getClientFilter(req);
  next();
}

module.exports = clientIsolationMiddleware;
