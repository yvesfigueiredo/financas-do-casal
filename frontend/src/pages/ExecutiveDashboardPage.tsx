import React from "react";
import { TrendingUp, TrendingDown, PiggyBank, Tag, CreditCard, Landmark, Repeat, Target, Bell } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { HealthScoreGauge } from "../components/charts/HealthScoreGauge";
import { AssistantPanel } from "../components/charts/AssistantPanel";
import { EmergencyReserveCard } from "../components/charts/EmergencyReserveCard";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { useExecutiveDashboard, useFinancialInsights } from "../hooks/useSprint3";
import { useFilterStore } from "../stores/filter.store";
import { formatCurrency } from "../utils/formatters";

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}

export function ExecutiveDashboardPage() {
  const { selectedUserId } = useFilterStore();
  const { data, isLoading, error } = useExecutiveDashboard(selectedUserId);
  const { data: insights } = useFinancialInsights(selectedUserId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Dashboard Executivo" subtitle="Visão consolidada da sua saúde financeira" />

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar dashboard executivo." />}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Coluna esquerda: Health Score + Reserva */}
          <div className="space-y-5">
            <HealthScoreGauge data={data.healthScore} />
            <EmergencyReserveCard data={data.emergencyReserve} />
          </div>

          {/* Coluna central: Stats + Top entidades */}
          <div className="lg:col-span-2 space-y-5">
            {/* Saldo */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-brand-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Atual</p>
                <p className={["text-2xl font-bold font-mono mt-1", data.balance.current >= 0 ? "text-brand-700" : "text-red-600"].join(" ")}>
                  {formatCurrency(data.balance.current)}
                </p>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Previsto</p>
                <p className={["text-2xl font-bold font-mono mt-1", data.balance.forecast >= 0 ? "text-purple-700" : "text-red-600"].join(" ")}>
                  {formatCurrency(data.balance.forecast)}
                </p>
              </Card>
            </div>

            {/* Médias */}
            <Card>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Médias Mensais (3 meses)</p>
              <div className="grid grid-cols-3 gap-3">
                <MiniStat icon={TrendingUp} label="Receita" value={formatCurrency(data.averages.income)} color="#10b981" />
                <MiniStat icon={TrendingDown} label="Despesa" value={formatCurrency(data.averages.expense)} color="#f87171" />
                <MiniStat icon={PiggyBank} label="Economia" value={formatCurrency(data.averages.savings)} color="#0ea5e9" />
              </div>
            </Card>

            {/* Top entidades */}
            <Card>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Destaques do Mês</p>
              <div className="grid grid-cols-2 gap-3">
                {data.topEntities.category && (
                  <MiniStat icon={Tag} label="Maior categoria" value={`${data.topEntities.category.name} · ${formatCurrency(data.topEntities.category.amount)}`} color="#8b5cf6" />
                )}
                {data.topEntities.card && (
                  <MiniStat icon={CreditCard} label="Maior cartão" value={`${data.topEntities.card.name} · ${formatCurrency(data.topEntities.card.amount)}`} color="#f97316" />
                )}
                {data.topEntities.bankAccount && (
                  <MiniStat icon={Landmark} label="Maior conta" value={`${data.topEntities.bankAccount.name} · ${formatCurrency(data.topEntities.bankAccount.balance)}`} color="#0ea5e9" />
                )}
                {data.topEntities.recurringExpense && (
                  <MiniStat icon={Repeat} label="Maior conta fixa" value={`${data.topEntities.recurringExpense.description} · ${formatCurrency(data.topEntities.recurringExpense.amount)}`} color="#ec4899" />
                )}
              </div>
            </Card>

            {/* Objetivos e Alertas */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Objetivos</p>
                </div>
                <p className="text-2xl font-bold text-slate-800">{data.goalsSummary.total}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-emerald-600">{data.goalsSummary.onTrack} no caminho</span>
                  {data.goalsSummary.atRisk > 0 && <span className="text-amber-600">{data.goalsSummary.atRisk} em risco</span>}
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas Ativos</p>
                </div>
                <p className="text-2xl font-bold text-slate-800">{data.alertsCount}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {data.insightsCount.critical > 0 && <span className="text-red-600">{data.insightsCount.critical} crítico(s)</span>}
                  {data.insightsCount.warning > 0 && <span className="text-amber-600">{data.insightsCount.warning} alerta(s)</span>}
                </div>
              </Card>
            </div>
          </div>

          {/* Assistente — linha completa abaixo */}
          <div className="lg:col-span-3">
            <AssistantPanel insights={insights ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}
