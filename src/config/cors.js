const allowedOrigins = getAllowedOrigins();

function getAllowedOrigins() {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim());
  }

  return [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ];
}

function applyCors(req, res, next) {
  const origin = req.headers.origin;

  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

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
