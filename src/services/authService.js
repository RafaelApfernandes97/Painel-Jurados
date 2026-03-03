const ClientUser = require("../models/ClientUser");
const SuperAdmin = require("../models/SuperAdmin");
const { generateToken } = require("./jwtService");

function createAuthResponse({ userId, role, clientId }) {
  const token = generateToken({
    userId,
    role,
    clientId: clientId || null
  });

  return { token };
}

async function loginSuperAdmin(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await SuperAdmin.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  return createAuthResponse({
    userId: user._id.toString(),
    role: "superadmin"
  });
}

async function loginClientUser(email, password) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await ClientUser.findOne({ email: normalizedEmail }).populate("clientId");

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!user.clientId) {
    const error = new Error("Client not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.clientId.status === "bloqueado" || user.clientId.status === "expirado") {
    const error = new Error("Client access is unavailable");
    error.statusCode = 403;
    throw error;
  }

  return createAuthResponse({
    userId: user._id.toString(),
    role: user.role,
    clientId: user.clientId._id.toString()
  });
}

module.exports = {
  loginSuperAdmin,
  loginClientUser
};
