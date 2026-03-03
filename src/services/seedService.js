const SuperAdmin = require("../models/SuperAdmin");
const logger = require("./logger");

async function seedSuperAdmin() {
  const email = "admin@plataforma.com";
  const existingAdmin = await SuperAdmin.findOne({ email });

  if (existingAdmin) {
    logger.info("Default SuperAdmin already exists");
    return;
  }

  await SuperAdmin.create({
    email,
    password: "admin123"
  });

  logger.info("Default SuperAdmin seeded");
}

module.exports = {
  seedSuperAdmin
};
