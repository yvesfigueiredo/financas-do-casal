import React, { useState } from "react";
import { Clock, TrendingUp, TrendingDown, CreditCard, Repeat, Receipt } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/FormFields";
import { PageLoader, ErrorMessage, EmptyState } from "../components/ui/Feedback";
import { useTimeline } from "../hooks/useSprint3";
import { useFilterStore } from "../stores/filter.store";
import { formatCurrency } from "../utils/formatters";
import { TimelineEvent } from "../types";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  income:      { icon: TrendingUp,  color: "#10b981", label: "Receita" },
  expense:     { icon: TrendingDown,color: "#f87171", label: "Despesa" },
  installment: { icon: CreditCard,  color: "#0ea5e9", label: "Parcela" },
  recurring:   { icon: Repeat,      color: "#8b5cf6", label: "Conta Fixa" },
  invoice:     { icon: Receipt,     color: "#f97316", label: "Fatura" },
};

function groupByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const map = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const key = ev.dateLabel;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

export function TimelinePage() {
  const [daysAhead, setDaysAhead] = useState(60);
  const { selectedUserId } = useFilterStore();
  const { data: events, isLoading, error } = useTimeline(daysAhead, selectedUserId);

  const periodOptions = [
    { value: "30", label: "Próximos 30 dias" },
    { value: "60", label: "Próximos 60 dias" },
    { value: "90", label: "Próximos 90 dias" },
    { value: "180", label: "Próximos 180 dias" },
  ];

  const grouped = events ? groupByDate(events) : new Map<string, TimelineEvent[]>();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title="Linha do Tempo Financeira" subtitle="Todos os eventos futuros em ordem cronológica"
        action={
          <Select options={periodOptions} value={String(daysAhead)}
            onChange={(e) => setDaysAhead(Number(e.target.value))} className="w-full sm:w-48" />
        } />

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar a linha do tempo." />}

      {events && events.length === 0 && (
        <EmptyState icon={<Clock />} title="Nenhum evento futuro"
          description="Não há receitas, despesas, parcelas ou contas fixas previstas para este período." />
      )}

      {events && events.length > 0 && (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateLabel, dayEvents]) => (
              <div key={dateLabel} className="relative">
                {/* Marcador de data */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-white border-2 border-brand-400 flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-xs font-bold text-brand-600 leading-none">{dateLabel.split("/")[0]}</span>
                    <span className="text-[9px] text-brand-400 leading-none mt-0.5">/{dateLabel.split("/")[1]}</span>
                  </div>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* Eventos do dia */}
                <div className="ml-[68px] space-y-2 -mt-10 pt-10">
                  {dayEvents.map((ev) => {
                    const config = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.expense;
                    const Icon = config.icon;
                    const isPositive = ev.type === "income";

                    return (
                      <Card key={ev.id} padding="sm" className="hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: config.color + "18" }}>
                              <Icon className="w-4 h-4" style={{ color: config.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{ev.title}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-400">{ev.userName}</span>
                                <span className="text-slate-200">·</span>
                                <span className="text-xs text-slate-400">{ev.category}</span>
                                {ev.cardName && (
                                  <>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-xs text-slate-400">{ev.cardName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={["text-sm font-bold font-mono", isPositive ? "text-emerald-600" : "text-red-600"].join(" ")}>
                              {isPositive ? "+" : "-"}{formatCurrency(ev.amount)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {/* Saldo previsto após os eventos do dia */}
                  <div className="flex items-center justify-end gap-2 px-2 pt-1">
                    <span className="text-xs text-slate-400">Saldo previsto:</span>
                    <span className={["text-xs font-bold font-mono",
                      dayEvents[dayEvents.length - 1].projectedBalance >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                      {formatCurrency(dayEvents[dayEvents.length - 1].projectedBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      {events && events.length > 0 && (
        <div className="flex items-center gap-4 mt-8 flex-wrap justify-center border-t border-slate-100 pt-4">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
