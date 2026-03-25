function applyCors(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

function isAllowedOrigin() {
  return true;
}

module.exports = {
  applyCors,
  isAllowedOrigin
};
