import React, { useState } from "react";
import { Plus, RefreshCw, CreditCard, TrendingDown, Calendar, Tag } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { SummaryCards } from "../components/charts/SummaryCards";
import { CategoryPieChart } from "../components/charts/CategoryPieChart";
import { UserBarChart } from "../components/charts/UserBarChart";
import { UpcomingInstallmentsCard } from "../components/charts/UpcomingInstallments";
import { PeriodFilter } from "../components/forms/PeriodFilter";
import { NewTransactionModal } from "../components/forms/NewTransactionModal";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { Button } from "../components/ui/Button";
import { useDashboard } from "../hooks/useDashboard";
import { useFilterStore } from "../stores/filter.store";
import { useAuthStore } from "../stores/auth.store";
import { getMonthName, formatCurrency } from "../utils/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function CreditSummaryCard({ used, available, limit }: { used: number; available: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <Card className="border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Crédito</p>
          <p className="text-2xl font-bold text-purple-700 mt-1 font-mono">{formatCurrency(available)}</p>
          <p className="text-xs text-slate-400 mt-0.5">disponível de {formatCurrency(limit)}</p>
        </div>
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-purple-500" />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Utilizado: {formatCurrency(used)}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#8b5cf6" }} />
        </div>
      </div>
    </Card>
  );
}

function QuickInfoCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <Card className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "20" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { month, year, selectedUserId } = useFilterStore();
  const { currentUser } = useAuthStore();

  const { data, isLoading, error, refetch, isFetching } = useDashboard({
    month, year, userId: selectedUserId,
  });

  const cardChartData = (data?.byCard ?? []).map((c) => ({ name: c.cardName, value: c.total, color: c.color }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" subtitle={`${getMonthName(month)} ${year}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} disabled={isFetching}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Atualizar">
              <RefreshCw className={["w-4 h-4", isFetching ? "animate-spin" : ""].join(" ")} />
            </button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
              Novo Lançamento
            </Button>
          </div>
        } />

      <div className="mb-6"><PeriodFilter showUserFilter showAllUsersOption /></div>

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar o dashboard. Tente novamente." />}

      {data && (
        <div className="space-y-5">
          {/* Cards principais (Sprint 1) */}
          <SummaryCards totalIncome={data.totalIncome} totalExpense={data.totalExpense} balance={data.balance} />

          {/* Card de crédito + Quick info (Sprint 2) */}
          <div className="grid grid-cols-4 gap-4">
            <CreditSummaryCard used={data.totalCreditUsed} available={data.totalCreditAvailable} limit={data.totalCreditLimit} />
            <QuickInfoCard icon={TrendingDown} label="Comprometido em parcelas" value={formatCurrency(data.committedInstallments)} color="#f97316" />
            <QuickInfoCard icon={Calendar} label="Comprometido em fixas" value={formatCurrency(data.committedRecurring)} color="#8b5cf6" />
            <QuickInfoCard icon={Tag} label="Maior categoria" value={data.topCategory ?? "–"} color="#0ea5e9"
              sub={data.topCard ? `Cartão: ${data.topCard}` : undefined} />
          </div>

          {/* Previsão de saldo + próximas faturas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Previsão de saldo</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-400">Atual</p>
                  <p className={["text-xl font-bold font-mono", data.balance >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                    {formatCurrency(data.balance)}
                  </p>
                </div>
                <div className="text-slate-200 text-2xl">→</div>
                <div>
                  <p className="text-xs text-slate-400">Estimado (fim do mês)</p>
                  <p className={["text-xl font-bold font-mono", data.balanceForecast >= 0 ? "text-emerald-600" : "text-red-600"].join(" ")}>
                    {formatCurrency(data.balanceForecast)}
                  </p>
                </div>
              </div>
              {(data.nextBill || data.nextInvoice) && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  {data.nextBill && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Próxima conta: <strong>{data.nextBill.description}</strong></span>
                      <span className="font-mono text-red-600">{formatCurrency(data.nextBill.amount)}</span>
                    </div>
                  )}
                  {data.nextInvoice && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Próxima fatura: <strong>{data.nextInvoice.cardName}</strong></span>
                      <span className="font-mono text-red-600">{formatCurrency(data.nextInvoice.amount)}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Próximas faturas */}
            <Card>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Próximas Faturas</p>
              {data.nextInvoices.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhuma fatura pendente</p>
              ) : (
                <div className="space-y-2">
                  {data.nextInvoices.filter((i) => i.amount > 0).map((inv) => (
                    <div key={inv.cardId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: inv.color }} />
                        <span className="text-sm text-slate-700">{inv.cardName}</span>
                        <span className="text-xs text-slate-400">dia {inv.dueDay}</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600 font-mono">{formatCurrency(inv.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-2 gap-4">
            <CategoryPieChart data={data.byCategory} />
            <UserBarChart data={data.byUser} />
          </div>

          {/* Gráfico por cartão */}
          {cardChartData.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-slate-700 mb-4">Gastos por Cartão</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cardChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Gastos"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {cardChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Comprometimento futuro */}
          <UpcomingInstallmentsCard data={data.upcomingInstallments} />
        </div>
      )}

      <NewTransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultUserId={currentUser?.id} />
    </div>
  );
}
