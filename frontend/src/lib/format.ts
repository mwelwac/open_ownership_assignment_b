export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function formatAmount(value: string | null | undefined): string {
  if (!value) return "—";
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number)
    : value;
}
