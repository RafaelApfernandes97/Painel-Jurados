const { randomUUID } = require("crypto");
const Judge = require("../models/Judge");

function normalizeBaseUrl(value, fallback) {
  const url = (value || fallback || "").trim();

  return url.replace(/\/+$/, "");
}

const JURY_BASE_URL = normalizeBaseUrl(process.env.JURY_BASE_URL, "http://localhost:5174/jury");

async function generateJudgeAccessToken() {
  let token;
  let existingJudge;

  do {
    token = randomUUID();
    existingJudge = await Judge.findOne({ token_acesso: token });
  } while (existingJudge);

  return token;
}

function buildJudgeAccessLink(token) {
  return `${JURY_BASE_URL}/${token}`;
}

module.exports = {
  generateJudgeAccessToken,
  buildJudgeAccessLink
};
