import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { useProjection } from "../hooks/useSprint3";
import { useFilterStore } from "../stores/filter.store";
import { formatCurrency } from "../utils/formatters";

const PERIOD_OPTIONS: { value: 6 | 12 | 24 | 36; label: string }[] = [
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
  { value: 24, label: "24 meses" },
  { value: 36, label: "36 meses" },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 text-xs">
          <span className="text-slate-500">{p.name}</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ProjectionPage() {
  const [period, setPeriod] = useState<6 | 12 | 24 | 36>(12);
  const { selectedUserId } = useFilterStore();
  const { data, isLoading, error } = useProjection(period, selectedUserId);

  const tickFormatter = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v.toFixed(0)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Projeção Financeira" subtitle="Saldo projetado considerando todos os compromissos futuros" />

      {/* Seletor de período */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setPeriod(opt.value)}
            className={["px-4 py-2 rounded-xl text-sm font-medium transition-all",
              period === opt.value ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300"].join(" ")}>
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar projeção." />}

      {data && (
        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-brand-500">
              <p className="text-xs text-slate-400">Receita média/mês</p>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{formatCurrency(data.summary.averageMonthlyIncome)}</p>
            </Card>
            <Card className="border-l-4 border-l-red-400">
              <p className="text-xs text-slate-400">Despesa média/mês</p>
              <p className="text-xl font-bold text-red-600 font-mono mt-1">{formatCurrency(data.summary.averageMonthlyExpense)}</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs text-slate-400">Economia média/mês</p>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{formatCurrency(data.summary.averageMonthlySavings)}</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-xs text-slate-400">Comprometido (parcelas+fixas)</p>
              <p className="text-xl font-bold text-purple-700 font-mono mt-1">
                {formatCurrency(data.summary.totalInstallmentCommitment + data.summary.totalRecurringCommitment)}
              </p>
            </Card>
          </div>

          {/* Marcos de projeção */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "6 meses", value: data.summary.projectedBalanceAt6m },
              { label: "12 meses", value: data.summary.projectedBalanceAt12m },
              { label: "24 meses", value: data.summary.projectedBalanceAt24m },
              { label: "36 meses", value: data.summary.projectedBalanceAt36m },
            ].map((m) => (
              <Card key={m.label} padding="sm" className="text-center">
                <p className="text-xs text-slate-400">{m.label}</p>
                <p className={["text-lg font-bold font-mono mt-1", m.value >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                  {formatCurrency(m.value)}
                </p>
              </Card>
            ))}
          </div>

          {/* Gráfico de área */}
          <Card>
            <CardHeader title={`Saldo Projetado — ${period} Meses`}
              subtitle="Considera receitas, despesas, parcelamentos e contas fixas" />
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.months}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.split(" ")[0].substring(0, 3)} axisLine={false} tickLine={false} interval={period > 12 ? 1 : 0} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="runningBalance" name="Saldo Projetado" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#projGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabela detalhada */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Detalhamento Mensal</h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100">
                    {["Mês", "Receita", "Despesa", "Parcelas", "Fixas", "Saldo Mês", "Acumulado"].map((h) => (
                      <th key={h} className="text-left font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.months.map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{m.monthLabel}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">+{formatCurrency(m.projectedIncome)}</td>
                      <td className="px-4 py-2.5 font-mono text-red-500">-{formatCurrency(m.projectedExpense)}</td>
                      <td className="px-4 py-2.5 font-mono text-orange-500">-{formatCurrency(m.projectedInstallments)}</td>
                      <td className="px-4 py-2.5 font-mono text-purple-500">-{formatCurrency(m.projectedRecurring)}</td>
                      <td className={["px-4 py-2.5 font-mono font-semibold", m.projectedBalance >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
                        {formatCurrency(m.projectedBalance)}
                      </td>
                      <td className={["px-4 py-2.5 font-mono font-bold", m.runningBalance >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                        {formatCurrency(m.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
