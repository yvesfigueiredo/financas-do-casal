import React from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../utils/formatters";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Receitas */}
      <Card className="border-l-4 border-l-emerald-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receitas
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </Card>

      {/* Despesas */}
      <Card className="border-l-4 border-l-red-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Despesas
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1 font-mono">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </Card>

      {/* Saldo */}
      <Card
        className={[
          "border-l-4",
          balance >= 0 ? "border-l-brand-500" : "border-l-orange-500",
        ].join(" ")}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo
            </p>
            <p
              className={[
                "text-2xl font-bold mt-1 font-mono",
                balance >= 0 ? "text-brand-700" : "text-orange-600",
              ].join(" ")}
            >
              {formatCurrency(balance)}
            </p>
          </div>
          <div
            className={[
              "w-10 h-10 rounded-xl flex items-center justify-center",
              balance >= 0 ? "bg-brand-50" : "bg-orange-50",
            ].join(" ")}
          >
            <Wallet
              className={[
                "w-5 h-5",
                balance >= 0 ? "text-brand-500" : "text-orange-500",
              ].join(" ")}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
