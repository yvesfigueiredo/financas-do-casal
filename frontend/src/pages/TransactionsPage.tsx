import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { PeriodFilter } from "../components/forms/PeriodFilter";
import { TransactionTable } from "../components/forms/TransactionTable";
import { NewTransactionModal } from "../components/forms/NewTransactionModal";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FAB } from "../components/ui/FAB";
import { PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { Select } from "../components/ui/FormFields";
import { useTransactions } from "../hooks/useTransactions";
import { useFilterStore } from "../stores/filter.store";
import { useAuthStore } from "../stores/auth.store";
import { useUsers } from "../hooks/useUsers";
import { TransactionType } from "../types";

export function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");

  const { month, year } = useFilterStore();
  const { currentUser } = useAuthStore();
  const { data: users } = useUsers();

  // userId local para a tabela (independente do dashboard)
  const [localUserId, setLocalUserId] = useState<string>("");

  const { data, isLoading, error } = useTransactions({
    month,
    year,
    userId: localUserId || undefined,
    type: typeFilter || undefined,
    page,
    limit: 20,
  });

  const typeOptions = [
    { value: "", label: "Todos os tipos" },
    { value: "income", label: "Receitas" },
    { value: "expense", label: "Despesas" },
  ];

  const userOptions = [
    { value: "", label: "Todos" },
    ...(users ?? []).map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      <PageHeader
        title="Lançamentos"
        subtitle="Histórico completo de receitas e despesas"
        action={
          <Button
            className="hidden sm:inline-flex"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Novo Lançamento
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-6">
        <PeriodFilter />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as TransactionType | "");
            setPage(1);
          }}
          className="w-full sm:w-40"
        />
        <Select
          options={userOptions}
          value={localUserId}
          onChange={(e) => {
            setLocalUserId(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-36"
        />
      </div>

      {/* Conteúdo */}
      <Card padding="none">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            {data ? `${data.total} lançamento${data.total !== 1 ? "s" : ""}` : "Lançamentos"}
          </h2>
        </div>

        <div className="sm:px-5 sm:py-4">
          {isLoading && <div className="p-4"><PageLoader /></div>}
          {error && (
            <div className="p-4"><ErrorMessage message="Erro ao carregar lançamentos." /></div>
          )}
          {data && (
            <TransactionTable transactions={data.data} />
          )}
        </div>

        {/* Paginação */}
        {data && data.totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Página {data.page} de {data.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <NewTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultUserId={currentUser?.id}
      />

      <FAB onClick={() => setModalOpen(true)} label="Novo lançamento" />
    </div>
  );
}
