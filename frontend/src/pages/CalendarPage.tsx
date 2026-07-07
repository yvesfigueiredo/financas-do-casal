import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { PageLoader } from "../components/ui/Feedback";
import { useTransactions } from "../hooks/useTransactions";
import { useRecurringExpenses } from "../hooks/useRecurringExpenses";
import { useInstallments } from "../hooks/useInstallments";
import { MONTH_NAMES, formatCurrency } from "../utils/formatters";
import { TransactionWithRelations, RecurringExpense } from "../types";

interface DayEvent {
  id: string;
  label: string;
  amount: number;
  color: string;
  type: "income" | "expense" | "installment" | "recurring" | "invoice";
}

function buildDayEvents(
  day: number,
  month: number,
  year: number,
  transactions: TransactionWithRelations[],
  recurring: RecurringExpense[]
): DayEvent[] {
  const events: DayEvent[] = [];

  // Transações do dia
  for (const t of transactions) {
    const d = new Date(t.date);
    if (d.getDate() !== day) continue;
    if (t.installmentId) {
      events.push({ id: t.id, label: t.description, amount: t.amount, color: "#0ea5e9", type: "installment" });
    } else if (t.type === "income") {
      events.push({ id: t.id, label: t.description, amount: t.amount, color: "#10b981", type: "income" });
    } else {
      events.push({ id: t.id, label: t.description, amount: t.amount, color: "#f87171", type: "expense" });
    }
  }

  // Contas fixas que vencem neste dia
  for (const r of recurring) {
    if (r.dueDay === day && r.active) {
      events.push({ id: r.id, label: r.description, amount: r.amount, color: "#8b5cf6", type: "recurring" });
    }
  }

  return events;
}

export function CalendarPage() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: txData, isLoading } = useTransactions({ month: viewMonth, year: viewYear, limit: 100 });
  const { data: recurring } = useRecurringExpenses();
  const { data: installments } = useInstallments();

  const transactions = txData?.data ?? [];
  const recurringList = recurring ?? [];

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=dom
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const selectedEvents = selectedDay
    ? buildDayEvents(selectedDay, viewMonth, viewYear, transactions, recurringList)
    : [];

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const COLOR_LEGEND = [
    { color: "#10b981", label: "Receita" },
    { color: "#f87171", label: "Despesa" },
    { color: "#0ea5e9", label: "Parcela" },
    { color: "#8b5cf6", label: "Conta fixa" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Calendário Financeiro" subtitle="Visualize todos os eventos por dia" />

      {isLoading && <PageLoader />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card padding="none">
            {/* Header do mês */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-slate-800">{MONTH_NAMES[viewMonth - 1]} {viewYear}</p>
                <div className="flex items-center gap-3 mt-0.5 justify-center">
                  <span className="text-xs text-emerald-600">+{formatCurrency(totalIncome)}</span>
                  <span className="text-xs text-red-500">-{formatCurrency(totalExpense)}</span>
                </div>
              </div>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {dayNames.map((d) => (
                <div key={d} className="text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-400">{d}</div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7">
              {/* Células vazias do início */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[80px] border-b border-r border-slate-50" />
              ))}

              {/* Dias */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const events = buildDayEvents(day, viewMonth, viewYear, transactions, recurringList);
                const isToday = day === today.getDate() && viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear();
                const isSelected = day === selectedDay;

                return (
                  <button key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={["min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border-b border-r border-slate-50 text-left hover:bg-slate-50 transition-colors w-full",
                      isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-300" : ""].join(" ")}>
                    <span className={["inline-flex w-5 h-5 sm:w-6 sm:h-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold mb-1",
                      isToday ? "bg-brand-600 text-white" : "text-slate-700"].join(" ")}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {events.slice(0, 2).map((ev, j) => (
                        <div key={j} className="flex items-center gap-0.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                          <span className="text-[9px] text-slate-500 truncate">{ev.label}</span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <p className="text-[9px] text-slate-400">+{events.length - 2} mais</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {COLOR_LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de detalhe */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">
                {selectedDay ? `Dia ${selectedDay} de ${MONTH_NAMES[viewMonth - 1]}` : "Selecione um dia"}
              </h3>
              {selectedDay && selectedEvents.length > 0 && (
                <span className="text-xs text-slate-400">{selectedEvents.length} evento{selectedEvents.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {!selectedDay && (
              <p className="text-sm text-slate-400 text-center py-8">Clique em um dia no calendário para ver os eventos</p>
            )}

            {selectedDay && selectedEvents.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum evento neste dia</p>
            )}

            {selectedDay && selectedEvents.length > 0 && (
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{ev.label}</p>
                      <p className="text-xs text-slate-400 capitalize">{ev.type}</p>
                    </div>
                    <span className={["text-sm font-semibold font-mono flex-shrink-0",
                      ev.type === "income" ? "text-emerald-600" : "text-red-600"].join(" ")}>
                      {ev.type === "income" ? "+" : "-"}{formatCurrency(ev.amount)}
                    </span>
                  </div>
                ))}

                {/* Total do dia */}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Entradas</span>
                    <span className="text-emerald-600 font-mono">
                      +{formatCurrency(selectedEvents.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">Saídas</span>
                    <span className="text-red-500 font-mono">
                      -{formatCurrency(selectedEvents.filter((e) => e.type !== "income").reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Resumo do mês */}
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Resumo do mês</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receitas</span>
                <span className="text-emerald-600 font-mono font-semibold">+{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Despesas</span>
                <span className="text-red-500 font-mono font-semibold">-{formatCurrency(totalExpense)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600 font-semibold">Saldo</span>
                <span className={["font-mono font-bold",
                  (totalIncome - totalExpense) >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
