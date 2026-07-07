import { useState } from "react";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { NewTransactionModal } from "../components/forms/NewTransactionModal";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FAB } from "../components/ui/FAB";
import { PageLoader, ErrorMessage, EmptyState, Badge } from "../components/ui/Feedback";
import { useInstallments } from "../hooks/useInstallments";
import { useDeleteInstallment } from "../hooks/useTransactions";
import { useAuthStore } from "../stores/auth.store";
import { Installment, TransactionWithRelations } from "../types";
import {
  formatCurrency,
  getMonthShort,
  isPastDate,
} from "../utils/formatters";

// ============================================================
// LINHA DO TEMPO DE PARCELAS
// ============================================================

function InstallmentTimeline({
  installment,
}: {
  installment: Installment;
}) {
  const transactions = (installment.transactions ?? []) as TransactionWithRelations[];
  const sorted = [...transactions].sort(
    (a, b) =>
      (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0)
  );

  const paidCount = installment.paidCount;
  const total = installment.installmentCount;
  const progressPercent = Math.round((paidCount / total) * 100);

  return (
    <div className="mt-3">
      {/* Barra de progresso */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-500 flex-shrink-0">
          {paidCount}/{total}
        </span>
      </div>

      {/* Bolhas dos meses */}
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((t, i) => {
          const paid = isPastDate(t.date);
          const date = new Date(t.date);
          const monthLabel = getMonthShort(date.getMonth() + 1);

          return (
            <div
              key={i}
              title={`Parcela ${t.installmentNumber}/${t.installmentTotal} - ${formatCurrency(t.amount)}`}
              className={[
                "flex flex-col items-center px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                paid
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              <span>{monthLabel}</span>
              <span className="text-[10px] leading-none mt-0.5">
                {paid ? "✔" : "○"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CARD DE PARCELAMENTO
// ============================================================

function InstallmentCard({
  installment,
  onDelete,
}: {
  installment: Installment;
  onDelete: (id: string, description: string) => void;
}) {
  const paidCount = installment.paidCount;
  const total = installment.installmentCount;
  const isCompleted = paidCount === total;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={[
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isCompleted ? "bg-emerald-50" : "bg-brand-50",
            ].join(" ")}
          >
            <CreditCard
              className={[
                "w-5 h-5",
                isCompleted ? "text-emerald-500" : "text-brand-500",
              ].join(" ")}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">
              {installment.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400">{installment.userName}</span>
              <span className="text-slate-200">·</span>
              <span className="text-xs text-slate-400">{installment.categoryName}</span>
              {isCompleted && (
                <Badge variant="income">Quitado</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-base font-bold text-slate-800 font-mono">
            {formatCurrency(installment.totalAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {total}× {formatCurrency(installment.installmentValue)}
          </p>
        </div>
      </div>

      {/* Linha do tempo */}
      <InstallmentTimeline installment={installment} />

      {/* Rodapé com pendente e botão excluir */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-4">
          {installment.pendingCount > 0 && (
            <div>
              <p className="text-xs text-slate-400">A pagar</p>
              <p className="text-sm font-semibold text-red-600 font-mono">
                {formatCurrency(installment.pendingAmount)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Pago</p>
            <p className="text-sm font-semibold text-emerald-600 font-mono">
              {formatCurrency(installment.paidAmount)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(installment.id, installment.description)}
          className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Excluir parcelamento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

// ============================================================
// PÁGINA
// ============================================================

export function InstallmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const { currentUser } = useAuthStore();
  const { data: installments, isLoading, error } = useInstallments();
  const deleteInstallment = useDeleteInstallment();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteInstallment.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const active = (installments ?? []).filter(
    (i) => i.pendingCount > 0
  );
  const completed = (installments ?? []).filter(
    (i) => i.pendingCount === 0
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 sm:pb-6">
      <PageHeader
        title="Parcelas"
        subtitle="Compras parceladas e linha do tempo"
        action={
          <Button
            className="hidden sm:inline-flex"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Nova Compra Parcelada
          </Button>
        }
      />

      {isLoading && <PageLoader />}

      {error && (
        <ErrorMessage message="Erro ao carregar parcelamentos." />
      )}

      {installments && installments.length === 0 && (
        <EmptyState
          icon={<CreditCard />}
          title="Nenhuma compra parcelada"
          description="Registre uma compra parcelada para visualizar a linha do tempo."
          action={
            <Button onClick={() => setModalOpen(true)}>
              Criar primeiro parcelamento
            </Button>
          }
        />
      )}

      {installments && installments.length > 0 && (
        <div className="space-y-6">
          {/* Parcelamentos em andamento */}
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Em andamento ({active.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {active.map((inst) => (
                  <InstallmentCard
                    key={inst.id}
                    installment={inst}
                    onDelete={(id, desc) =>
                      setDeleteTarget({ id, description: desc })
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Parcelamentos quitados */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Quitados ({completed.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completed.map((inst) => (
                  <InstallmentCard
                    key={inst.id}
                    installment={inst}
                    onDelete={(id, desc) =>
                      setDeleteTarget({ id, description: desc })
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal de novo lançamento parcelado */}
      <NewTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultUserId={currentUser?.id}
      />

      <FAB onClick={() => setModalOpen(true)} label="Nova compra parcelada" />

      {/* Confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-base font-semibold text-slate-800">
              Excluir parcelamento
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Isso excluirá o parcelamento{" "}
              <strong>"{deleteTarget.description}"</strong> e todas as suas
              parcelas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 mt-5">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteInstallment.isPending}
                fullWidth
              >
                Excluir tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
