export const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
export const MONTH_SHORT = [
  "Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
export function getMonthName(month: number): string { return MONTH_NAMES[month - 1] ?? ""; }
export function getMonthShort(month: number): string { return MONTH_SHORT[month - 1] ?? ""; }

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}
export function getMonthYear(dateStr: string): { month: number; year: number } {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}
export function getYearOptions(): number[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, i) => y - 4 + i);
}
export function isPastMonth(month: number, year: number): boolean {
  const now = new Date();
  if (year < now.getFullYear()) return true;
  return year === now.getFullYear() && month < now.getMonth() + 1;
}
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}
export function formatCompact(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
}
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
