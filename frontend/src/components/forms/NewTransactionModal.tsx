import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { SimpleTransactionForm } from "./SimpleTransactionForm";
import { InstallmentForm } from "./InstallmentForm";

type Tab = "simple" | "installment";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserId?: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  defaultUserId,
}: NewTransactionModalProps) {
  const [tab, setTab] = useState<Tab>("simple");

  const handleSuccess = () => {
    onClose();
    setTab("simple");
  };

  const handleCancel = () => {
    onClose();
    setTab("simple");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento"
      size="md"
    >
      {/* Seletor de tipo de lançamento */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
        <button
          type="button"
          onClick={() => setTab("simple")}
          className={[
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            tab === "simple"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          Lançamento Simples
        </button>
        <button
          type="button"
          onClick={() => setTab("installment")}
          className={[
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            tab === "installment"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          Parcelado
        </button>
      </div>

      {tab === "simple" ? (
        <SimpleTransactionForm
          defaultUserId={defaultUserId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <InstallmentForm
          defaultUserId={defaultUserId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Modal>
  );
}
