const jwt = require("jsonwebtoken");

const INSECURE_SECRETS = ["change_me", "secret", "jwt_secret", "123456"];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  if (process.env.NODE_ENV === "production" && INSECURE_SECRETS.includes(secret)) {
    throw new Error("JWT_SECRET is insecure. Set a strong secret for production!");
  }

  return secret;
}

function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "1d"
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  generateToken,
  verifyToken
};
