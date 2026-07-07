import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Select } from "../components/ui/FormFields";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { useAnnualSummary } from "../hooks/useDashboard";
import { useFilterStore } from "../stores/filter.store";
import { getYearOptions, formatCurrency } from "../utils/formatters";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-slate-500">{p.name}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function AnnualPage() {
  const { year, selectedUserId } = useFilterStore();
  const [localYear, setLocalYear] = useState(year);

  const { data, isLoading, error } = useAnnualSummary(localYear, selectedUserId);

  const yearOptions = getYearOptions().map((y) => ({ value: String(y), label: String(y) }));

  const tickFormatter = (v: number) =>
    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Resumo Anual" subtitle="Receitas, despesas e saldo acumulado do ano"
        action={
          <Select options={yearOptions} value={String(localYear)}
            onChange={(e) => setLocalYear(Number(e.target.value))} className="w-28" />
        } />

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar resumo anual." />}

      {data && (
        <div className="space-y-6">
          {/* Cards de totais do ano */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receitas no Ano</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                {formatCurrency(data.months.reduce((s, m) => s + m.totalIncome, 0))}
              </p>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Despesas no Ano</p>
              <p className="text-2xl font-bold text-red-600 font-mono mt-1">
                {formatCurrency(data.months.reduce((s, m) => s + m.totalExpense, 0))}
              </p>
            </Card>
            <Card className="border-l-4 border-l-brand-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Acumulado</p>
              <p className={["text-2xl font-bold font-mono mt-1",
                (data.accumulatedBalance[11]?.balance ?? 0) >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                {formatCurrency(data.accumulatedBalance[data.accumulatedBalance.length - 1]?.balance ?? 0)}
              </p>
            </Card>
          </div>

          {/* Gráfico de linhas: Receitas x Despesas */}
          <Card>
            <CardHeader title="Receitas × Despesas por Mês" />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.substring(0, 3)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={tickFormatter} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                <Line type="monotone" dataKey="totalIncome" name="Receitas" stroke="#10b981"
                  strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="totalExpense" name="Despesas" stroke="#f87171"
                  strokeWidth={2.5} dot={{ fill: "#f87171", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de linha: Saldo acumulado */}
          <Card>
            <CardHeader title="Saldo Acumulado Mês a Mês" />
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.accumulatedBalance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.substring(0, 3)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={tickFormatter} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="balance" name="Saldo Acumulado"
                  stroke="#0ea5e9" strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return <circle key={payload.month} cx={cx} cy={cy} r={3}
                      fill={payload.balance >= 0 ? "#0ea5e9" : "#ef4444"} />;
                  }}
                  activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de barras: Comprometimento futuro */}
          <Card>
            <CardHeader title="Comprometimento Futuro — Próximos 12 Meses"
              subtitle="Parcelas + Contas fixas mensais" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.futureCommitment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.split(" ")[0].substring(0, 3)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={tickFormatter} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                <Bar dataKey="installments" name="Parcelas" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="recurring" name="Contas Fixas" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabela mensal — cards no mobile, tabela no desktop */}
          <Card padding="none">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Detalhamento por Mês</h3>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden divide-y divide-slate-50">
              {data.months.map((m, i) => (
                <div key={m.month} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{m.monthLabel}</span>
                    <span className={["text-sm font-mono font-bold",
                      (data.accumulatedBalance[i]?.balance ?? 0) >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
                      {formatCurrency(data.accumulatedBalance[i]?.balance ?? 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-slate-400">Receitas</p><p className="font-mono text-emerald-600">{formatCurrency(m.totalIncome)}</p></div>
                    <div><p className="text-slate-400">Despesas</p><p className="font-mono text-red-600">{formatCurrency(m.totalExpense)}</p></div>
                    <div><p className="text-slate-400">Saldo</p><p className={["font-mono font-semibold", m.balance >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>{formatCurrency(m.balance)}</p></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Mês", "Receitas", "Despesas", "Saldo", "Acumulado"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.months.map((m, i) => (
                    <tr key={m.month} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{m.monthLabel}</td>
                      <td className="px-5 py-3 text-emerald-600 font-mono">{formatCurrency(m.totalIncome)}</td>
                      <td className="px-5 py-3 text-red-600 font-mono">{formatCurrency(m.totalExpense)}</td>
                      <td className={["px-5 py-3 font-semibold font-mono",
                        m.balance >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                        {formatCurrency(m.balance)}
                      </td>
                      <td className={["px-5 py-3 font-semibold font-mono",
                        (data.accumulatedBalance[i]?.balance ?? 0) >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
                        {formatCurrency(data.accumulatedBalance[i]?.balance ?? 0)}
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
