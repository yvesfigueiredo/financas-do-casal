import { Card } from "../ui/Card";
import { HealthScore } from "../../types";

const GRADE_COLORS: Record<string, string> = {
  A: "#10b981", B: "#0ea5e9", C: "#f59e0b", D: "#f97316", F: "#ef4444",
};

export function HealthScoreGauge({ data }: { data: HealthScore }) {
  const color = GRADE_COLORS[data.grade] ?? "#64748b";
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center text-center">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Índice de Saúde Financeira</p>
      <div className="relative w-44 h-44">
        <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
          <circle cx="88" cy="88" r="70" fill="none" stroke="#f1f5f9" strokeWidth="14" />
          <circle cx="88" cy="88" r="70" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{data.score}</span>
          <span className="text-xs text-slate-400">de 100</span>
          <span className="text-2xl font-bold mt-1" style={{ color }}>{data.grade}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700 mt-3">{data.label}</p>

      {/* Breakdown */}
      <div className="w-full mt-4 space-y-2">
        {data.breakdown.map((c) => (
          <div key={c.name} className="text-left">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-slate-500">{c.name}</span>
              <span className="font-mono text-slate-600">{c.score.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{
                  width: `${c.score}%`,
                  backgroundColor: c.status === "good" ? "#10b981" : c.status === "warning" ? "#f59e0b" : "#ef4444",
                }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
