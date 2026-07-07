import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "../ui/Card";
import { UserSummary } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { EmptyState } from "../ui/Feedback";
import { Users } from "lucide-react";

interface UserBarChartProps {
  data: UserSummary[];
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-xs text-slate-500">{item.name}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function UserBarChart({ data }: UserBarChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader title="Comparação Yves × Carol" />
        <EmptyState
          icon={<Users />}
          title="Sem dados no período"
          description="A comparação aparecerá aqui quando houver lançamentos."
        />
      </Card>
    );
  }

  // Monta dados no formato que o recharts espera
  const chartData = data.map((u) => ({
    name: u.userName,
    Receitas: u.totalIncome,
    Despesas: u.totalExpense,
  }));

  return (
    <Card>
      <CardHeader title="Comparação Yves × Carol" />
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
          <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
