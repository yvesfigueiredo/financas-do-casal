import React from "react";
import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { FinancialInsight } from "../../types";
import { EmptyState } from "../ui/Feedback";

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2" },
  warning:  { icon: AlertCircle,   color: "#f59e0b", bg: "#fffbeb" },
  positive: { icon: CheckCircle2,  color: "#10b981", bg: "#f0fdf4" },
  info:     { icon: Info,          color: "#0ea5e9", bg: "#f0f9ff" },
};

export function AssistantPanel({ insights }: { insights: FinancialInsight[] }) {
  return (
    <Card>
      <CardHeader title="Assistente Financeiro" subtitle="Análise automática dos seus dados"
        action={<Sparkles className="w-4 h-4 text-brand-400" />} />

      {insights.length === 0 && (
        <EmptyState icon={<Sparkles />} title="Nenhum insight no momento"
          description="O assistente irá gerar recomendações conforme seus dados financeiros mudarem." />
      )}

      <div className="space-y-2.5">
        {insights.map((insight) => {
          const config = SEVERITY_CONFIG[insight.severity];
          const Icon = config.icon;
          return (
            <div key={insight.id} className="rounded-xl p-3.5 border" style={{ backgroundColor: config.bg, borderColor: config.color + "30" }}>
              <div className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
                  <p className="text-xs text-slate-600 mt-1.5 font-medium">💡 {insight.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
