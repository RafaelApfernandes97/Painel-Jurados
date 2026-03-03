export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: options.withTime ? "short" : undefined
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function toIsoDateTime(value) {
  return value ? new Date(value).toISOString() : "";
}

export function eventStatusLabel(status) {
  const labels = {
    ativo: "Ativo",
    bloqueado: "Bloqueado",
    expirado: "Expirado",
    encerrado: "Encerrado",
    rascunho: "Rascunho"
  };

  return labels[status] || status;
}
