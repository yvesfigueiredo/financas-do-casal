import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { useCashFlow } from "../hooks/useDashboard";
import { useFilterStore } from "../stores/filter.store";
import { formatCurrency } from "../utils/formatters";
import { CashFlowMonth } from "../types";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px] max-w-[220px]">
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

// Linha de balanço mensal — grid fixo em desktop, card empilhado em mobile
function BalanceBar({ item }: { item: CashFlowMonth }) {
  const totalOut = item.expenses + item.installments + item.recurring;
  const maxVal = Math.max(Math.abs(item.income), Math.abs(totalOut));
  const incomeWidth = maxVal > 0 ? (item.income / maxVal) * 100 : 0;
  const expWidth = maxVal > 0 ? (totalOut / maxVal) * 100 : 0;

  return (
    <div className="py-3 sm:py-2 border-b border-slate-50 last:border-0 text-xs">
      {/* Mobile: cabeçalho do mês + saldo final na mesma linha */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <span className="text-slate-700 font-semibold">{item.monthLabel}</span>
        <span className={["font-mono font-bold", item.closingBalance >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
          {formatCurrency(item.closingBalance)}
        </span>
      </div>

      {/* Desktop: grid de 4 colunas | Mobile: barras empilhadas */}
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_100px] gap-1.5 sm:gap-3 sm:items-center">
        <span className="hidden sm:block text-slate-600 font-medium truncate">{item.monthLabel}</span>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${incomeWidth}%` }} />
          </div>
          <span className="text-emerald-600 font-mono min-w-[64px] text-right flex-shrink-0">{formatCurrency(item.income)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
            <div className="h-full bg-red-400 rounded-full" style={{ width: `${expWidth}%` }} />
          </div>
          <span className="text-red-500 font-mono min-w-[64px] text-right flex-shrink-0">{formatCurrency(totalOut)}</span>
        </div>

        <span className={["hidden sm:block font-mono font-semibold text-right", item.closingBalance >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
          {formatCurrency(item.closingBalance)}
        </span>
      </div>
    </div>
  );
}

// Card de composição mensal para mobile (substitui a tabela de 7 colunas)
function CompositionCard({ m }: { m: CashFlowMonth }) {
  return (
    <div className="p-4 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">{m.monthLabel}</span>
        <span className={["text-sm font-mono font-bold", m.closingBalance >= 0 ? "text-slate-800" : "text-red-600"].join(" ")}>
          {formatCurrency(m.closingBalance)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="flex justify-between"><span className="text-slate-400">Saldo inicial</span><span className="font-mono text-slate-500">{formatCurrency(m.openingBalance)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Receitas</span><span className="font-mono text-emerald-600">+{formatCurrency(m.income)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Despesas</span><span className="font-mono text-red-500">-{formatCurrency(m.expenses)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Parcelas</span><span className="font-mono text-orange-500">-{formatCurrency(m.installments)}</span></div>
        <div className="flex justify-between col-span-2"><span className="text-slate-400">Contas fixas</span><span className="font-mono text-purple-500">-{formatCurrency(m.recurring)}</span></div>
      </div>
    </div>
  );
}

export function CashFlowPage() {
  const { selectedUserId } = useFilterStore();
  const { data, isLoading, error } = useCashFlow(selectedUserId);

  const tickFormatter = (v: number) =>
    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v.toFixed(0)}`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Fluxo de Caixa" subtitle="Projeção de saldo para os próximos 24 meses" />

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar fluxo de caixa." />}

      {data && (
        <div className="space-y-6">
          {/* Gráfico de área: saldo projetado */}
          <Card>
            <CardHeader title="Saldo Projetado — 24 Meses" subtitle="Baseado em parcelas, contas fixas e histórico" />
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.split(" ")[0].substring(0, 3) + " " + v.split(" ")[1]?.slice(2)}
                  axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={tickFormatter} width={44} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="closingBalance" name="Saldo Projetado"
                  stroke="#0ea5e9" strokeWidth={2} fill="url(#balanceGrad)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return <circle key={payload.monthLabel} cx={cx} cy={cy} r={2.5}
                      fill={payload.closingBalance >= 0 ? "#0ea5e9" : "#ef4444"} />;
                  }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabela detalhada / barras de balanço */}
          <Card padding="none">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700">Detalhamento Mensal</h3>
              <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />Receitas</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" />Saídas</span>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-1 sm:py-2 overflow-y-auto max-h-[500px]">
              {data.map((item) => (
                <BalanceBar key={`${item.year}-${item.month}`} item={item} />
              ))}
            </div>
          </Card>

          {/* Composição do fluxo: cards no mobile, tabela no desktop */}
          <Card padding="none">
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Composição do Fluxo</h3>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden">
              {data.map((m) => (
                <CompositionCard key={`${m.year}-${m.month}`} m={m} />
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Mês", "Saldo Inicial", "Receitas", "Despesas", "Parcelas", "Fixas", "Saldo Final"].map((h) => (
                      <th key={h} className="text-left font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{m.monthLabel}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{formatCurrency(m.openingBalance)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">+{formatCurrency(m.income)}</td>
                      <td className="px-4 py-2.5 font-mono text-red-500">-{formatCurrency(m.expenses)}</td>
                      <td className="px-4 py-2.5 font-mono text-orange-500">-{formatCurrency(m.installments)}</td>
                      <td className="px-4 py-2.5 font-mono text-purple-500">-{formatCurrency(m.recurring)}</td>
                      <td className={["px-4 py-2.5 font-mono font-semibold",
                        m.closingBalance >= 0 ? "text-slate-800" : "text-red-600"].join(" ")}>
                        {formatCurrency(m.closingBalance)}
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
