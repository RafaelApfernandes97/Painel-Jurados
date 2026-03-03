const { loginClientUser, loginSuperAdmin } = require("../services/authService");

async function superAdminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const authResult = await loginSuperAdmin(email, password);

    res.status(200).json(authResult);
  } catch (error) {
    next(error);
  }
}

async function clientLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const authResult = await loginClientUser(email, password);

    res.status(200).json(authResult);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  superAdminLogin,
  clientLogin
};
