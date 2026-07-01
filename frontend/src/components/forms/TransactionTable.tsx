import React, { useState } from "react";
import { Trash2, CreditCard } from "lucide-react";
import { TransactionWithRelations } from "../../types";
import { Button } from "../ui/Button";
import { formatCurrency, formatDate } from "../../utils/formatters";
import {
  useDeleteTransaction,
  useDeleteInstallment,
} from "../../hooks/useTransactions";

interface TransactionTableProps {
  transactions: TransactionWithRelations[];
}

interface DeleteTarget {
  type: "simple" | "installment";
  id: string;
  description: string;
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const deleteSimple = useDeleteTransaction();
  const deleteInstallment = useDeleteInstallment();

  const handleDeleteClick = (t: TransactionWithRelations) => {
    if (t.installmentId) {
      setDeleteTarget({
        type: "installment",
        id: t.installmentId,
        description: t.installment?.description ?? t.description,
      });
    } else {
      setDeleteTarget({
        type: "simple",
        id: t.id,
        description: t.description,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "simple") {
      await deleteSimple.mutateAsync(deleteTarget.id);
    } else {
      await deleteInstallment.mutateAsync(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Nenhum lançamento encontrado para este período.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pl-1">
                Descrição
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                Categoria
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                Pessoa
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                Data
              </th>
              <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                Valor
              </th>
              <th className="pb-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-3 pl-1">
                  <div className="flex items-center gap-2">
                    {t.installmentId && (
                      <CreditCard className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-700">
                      {t.description}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-slate-500">{t.category.name}</span>
                </td>
                <td className="py-3">
                  <span className="text-slate-500">{t.user.name}</span>
                </td>
                <td className="py-3">
                  <span className="text-slate-400 font-mono text-xs">
                    {formatDate(t.date)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={[
                      "font-semibold font-mono",
                      t.type === "income"
                        ? "text-emerald-600"
                        : "text-red-600",
                    ].join(" ")}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDeleteClick(t)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-base font-semibold text-slate-800">
              Confirmar exclusão
            </h3>
            {deleteTarget.type === "installment" ? (
              <p className="mt-2 text-sm text-slate-500">
                Isso excluirá o parcelamento{" "}
                <strong>"{deleteTarget.description}"</strong> e{" "}
                <strong>todas as suas parcelas</strong>. Esta ação não pode ser
                desfeita.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Excluir o lançamento{" "}
                <strong>"{deleteTarget.description}"</strong>? Esta ação não
                pode ser desfeita.
              </p>
            )}
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
                loading={
                  deleteSimple.isPending || deleteInstallment.isPending
                }
                fullWidth
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
