const SuperAdmin = require("../models/SuperAdmin");
const logger = require("./logger");

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || "admin@plataforma.com";
  const password = process.env.SUPERADMIN_PASSWORD || "admin123";

  const existingAdmin = await SuperAdmin.findOne({ email });

  if (existingAdmin) {
    logger.info("Default SuperAdmin already exists");
    return;
  }

  if (!process.env.SUPERADMIN_PASSWORD) {
    logger.warn(
      "SUPERADMIN_PASSWORD not set - using insecure default. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in production!"
    );
  }

  await SuperAdmin.create({ email, password });

  logger.info("Default SuperAdmin seeded");
}

module.exports = {
  seedSuperAdmin
};
