function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const normalizedMeta = normalizeMeta(meta);

  if (!normalizedMeta) {
    return `[${timestamp}] ${level}: ${message}`;
  }

  return `[${timestamp}] ${level}: ${message} ${JSON.stringify(normalizedMeta)}`;
}

function normalizeMeta(meta) {
  if (!meta) {
    return null;
  }

  if (meta instanceof Error) {
    return {
      message: meta.message,
      stack: meta.stack
    };
  }

  return meta;
}

function info(message, meta) {
  console.log(formatMessage("INFO", message, meta));
}

function warn(message, meta) {
  console.warn(formatMessage("WARN", message, meta));
}

function error(message, meta) {
  console.error(formatMessage("ERROR", message, meta));
}

module.exports = {
  info,
  warn,
  error
};
