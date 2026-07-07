import { useState } from "react";
import { ChevronDown, ChevronUp, CalendarClock } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { UpcomingInstallmentSummary } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface UpcomingInstallmentsCardProps {
  data: UpcomingInstallmentSummary[];
}

function MonthBlock({ month }: { month: UpcomingInstallmentSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {month.monthLabel}
            </p>
            <p className="text-xs text-slate-400">
              {month.installments.length} parcela
              {month.installments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 font-mono">
            {formatCurrency(month.totalAmount)}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {month.installments.map((inst, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-400 font-mono flex-shrink-0">
                  {inst.installmentNumber}/{inst.installmentTotal}
                </span>
                <span className="text-sm text-slate-600 truncate">
                  {inst.description.replace(/ - Parcela \d+\/\d+$/, "")}
                </span>
              </div>
              <span className="text-sm font-semibold text-red-600 font-mono flex-shrink-0 ml-2">
                {formatCurrency(inst.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UpcomingInstallmentsCard({ data }: UpcomingInstallmentsCardProps) {
  const totalCommitment = data.reduce((sum, m) => sum + m.totalAmount, 0);

  return (
    <Card>
      <CardHeader
        title="Comprometimento Futuro"
        subtitle="Parcelas dos próximos 3 meses"
        action={
          data.length > 0 ? (
            <div className="text-right">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-sm font-bold text-red-600 font-mono">
                {formatCurrency(totalCommitment)}
              </p>
            </div>
          ) : undefined
        }
      />

      {data.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Nenhuma parcela futura encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((month) => (
            <MonthBlock key={`${month.year}-${month.month}`} month={month} />
          ))}
        </div>
      )}
    </Card>
  );
}
