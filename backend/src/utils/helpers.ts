// ============================================================
// UTILITÁRIOS GERAIS - Finanças do Casal (Sprint 1 + 2)
// ============================================================

import { Periodicity } from "../models/types";

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "Inválido";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateInstallmentValue(totalAmount: number, installmentCount: number): number {
  return roundMoney(totalAmount / installmentCount);
}

export function getInstallmentDate(startDate: Date, index: number): Date {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + index);
  return date;
}

export function isPastDate(date: Date): boolean {
  const now = new Date();
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return compareDate <= today;
}

export function getFirstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Retorna a data de vencimento da próxima ocorrência de uma recorrência
export function getNextDueDate(dueDay: number, periodicity: Periodicity, lastGenerated: Date | null): Date {
  const now = new Date();
  let base: Date;

  if (!lastGenerated) {
    base = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (base < now) base = addPeriod(base, periodicity);
  } else {
    base = addPeriod(new Date(lastGenerated.getFullYear(), lastGenerated.getMonth(), dueDay), periodicity);
  }

  return base;
}

// Avança uma data pela periodicidade configurada
export function addPeriod(date: Date, periodicity: Periodicity): Date {
  const d = new Date(date);
  switch (periodicity) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "semiannual":
      d.setMonth(d.getMonth() + 6);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

// Verifica se uma recorrência deve ser gerada no mês/ano indicado
export function shouldGenerateForMonth(
  periodicity: Periodicity,
  lastGenerated: Date | null,
  targetMonth: number,
  targetYear: number
): boolean {
  const targetDate = new Date(targetYear, targetMonth - 1, 1);
  const now = new Date();

  // Se nunca gerado, deve gerar a partir do mês atual
  if (!lastGenerated) {
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return targetDate >= currentMonthStart;
  }

  const nextExpected = addPeriod(lastGenerated, periodicity);
  const nextMonth = nextExpected.getMonth() + 1;
  const nextYear = nextExpected.getFullYear();

  return nextMonth === targetMonth && nextYear === targetYear;
}

// Retorna o label de periodicidade em português
export function getPeriodicityLabel(periodicity: Periodicity): string {
  const labels: Record<Periodicity, string> = {
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
  };
  return labels[periodicity];
}

// Calcula o período de fechamento/fatura de um cartão para o mês corrente
export function getCardBillingPeriod(closingDay: number, now?: Date): { start: Date; end: Date } {
  const ref = now ?? new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();

  // Fechamento: se o dia de fechamento já passou este mês, o período é do fechamento
  // do mês passado até o fechamento deste mês
  let end = new Date(year, month, closingDay);
  if (end <= ref) {
    // O fechamento já ocorreu, o período é o próximo
    end = new Date(year, month + 1, closingDay);
  }
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  start.setDate(start.getDate() + 1);

  return { start, end };
}

// Soma valores de uma array com campo numérico
export function sumField<T>(arr: T[], field: keyof T): number {
  return arr.reduce((sum, item) => sum + Number(item[field] ?? 0), 0);
}

// Formata data como DD/MM para a linha do tempo
export function formatDateLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}
