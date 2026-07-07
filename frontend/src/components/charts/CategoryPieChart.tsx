import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "../ui/Card";
import { CategorySummary } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { EmptyState } from "../ui/Feedback";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#6366f1",
];

interface CategoryPieChartProps {
  data: CategorySummary[];
}

interface TooltipPayload {
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-700">{item.name}</p>
      <p className="text-sm text-slate-600 font-mono mt-0.5">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader title="Despesas por Categoria" />
        <EmptyState
          icon={<PieChartIcon />}
          title="Sem despesas no período"
          description="As categorias aparecerão aqui quando houver lançamentos."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Despesas por Categoria" />
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
