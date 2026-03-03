export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: options.withTime ? "short" : undefined
  }).format(new Date(value));
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function clientStatusLabel(status) {
  const labels = {
    ativo: "Ativo",
    bloqueado: "Bloqueado",
    expirado: "Expirado"
  };

  return labels[status] || status;
}
