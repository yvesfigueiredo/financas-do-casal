import React from "react";
import { Shield } from "lucide-react";
import { Card } from "../ui/Card";
import { EmergencyReserve } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const STATUS_CONFIG = {
  critical:     { color: "#ef4444", label: "Crítica" },
  insufficient: { color: "#f59e0b", label: "Insuficiente" },
  adequate:     { color: "#0ea5e9", label: "Adequada" },
  excellent:    { color: "#10b981", label: "Excelente" },
};

export function EmergencyReserveCard({ data }: { data: EmergencyReserve }) {
  const config = STATUS_CONFIG[data.healthStatus];
  const percent = Math.min(100, (data.monthsProtected / data.targetMonths) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: config.color }} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserva de Emergência</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: config.color, backgroundColor: config.color + "18" }}>
          {config.label}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold font-mono" style={{ color: config.color }}>{data.monthsProtected.toFixed(1)}</span>
        <span className="text-sm text-slate-400 mb-1">de {data.targetMonths} meses</span>
      </div>

      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: config.color }} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><p className="text-slate-400">Reserva atual</p><p className="font-semibold text-slate-700">{formatCurrency(data.currentReserve)}</p></div>
        <div><p className="text-slate-400">Meta</p><p className="font-semibold text-slate-700">{formatCurrency(data.targetAmount)}</p></div>
        {data.shortfall > 0 && (
          <div className="col-span-2"><p className="text-slate-400">Falta</p><p className="font-semibold text-amber-600">{formatCurrency(data.shortfall)}</p></div>
        )}
      </div>
    </Card>
  );
}
