import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/FormFields";
import { useCategories, useUsers } from "../../hooks/useUsers";
import { useCreateTransaction } from "../../hooks/useTransactions";
import { useActiveCreditCards } from "../../hooks/useCreditCards";
import { useActiveBankAccounts } from "../../hooks/useBankAccounts";
import { CreateTransactionDTO, PaymentMethod, TransactionType, PAYMENT_METHOD_LABELS } from "../../types";

interface Props {
  defaultUserId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  description: string;
  amount: string;
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  userId: string;
  categoryId: string;
  creditCardId: string;
  bankAccountId: string;
}

export function SimpleTransactionForm({ defaultUserId = "", onSuccess, onCancel }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    description: "", amount: "", type: "expense", date: today,
    paymentMethod: "cash", userId: defaultUserId, categoryId: "", creditCardId: "", bankAccountId: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: users } = useUsers();
  const { data: categories } = useCategories(form.type);
  const { data: cards } = useActiveCreditCards(form.userId || undefined);
  const { data: accounts } = useActiveBankAccounts(form.userId || undefined);
  const mutation = useCreateTransaction();

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = "Informe a descrição";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Informe um valor válido";
    if (!form.date) e.date = "Informe a data";
    if (!form.userId) e.userId = "Selecione o usuário";
    if (!form.categoryId) e.categoryId = "Selecione a categoria";
    if (form.paymentMethod === "credit" && !form.creditCardId) e.creditCardId = "Selecione o cartão";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const data: CreateTransactionDTO = {
      description: form.description.trim(),
      amount: Number(form.amount),
      type: form.type,
      date: new Date(form.date + "T12:00:00").toISOString(),
      paymentMethod: form.paymentMethod,
      userId: form.userId,
      categoryId: form.categoryId,
      creditCardId: form.creditCardId || undefined,
      bankAccountId: form.bankAccountId || undefined,
    };
    try { await mutation.mutateAsync(data); onSuccess(); } catch { /* handled by mutation.error */ }
  };

  const set = (field: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const paymentMethodOptions = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][])
    .map(([value, label]) => ({ value, label }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button key={t} type="button"
            onClick={() => { set("type", t); set("categoryId", ""); }}
            className={["flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
              form.type === t
                ? t === "expense" ? "bg-white text-red-600 shadow-sm" : "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}>
            {t === "expense" ? "Despesa" : "Receita"}
          </button>
        ))}
      </div>

      <Input label="Descrição" placeholder="Ex: Supermercado" value={form.description}
        onChange={(e) => set("description", e.target.value)} error={errors.description} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
          value={form.amount} onChange={(e) => set("amount", e.target.value)} error={errors.amount} />
        <Input label="Data" type="date" value={form.date}
          onChange={(e) => set("date", e.target.value)} error={errors.date} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Pessoa" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
          placeholder="Selecione..." value={form.userId}
          onChange={(e) => { set("userId", e.target.value); set("creditCardId", ""); set("bankAccountId", ""); }}
          error={errors.userId} />
        <Select label="Categoria"
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Selecione..." value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} />
      </div>

      <Select label="Forma de pagamento" options={paymentMethodOptions}
        value={form.paymentMethod}
        onChange={(e) => { set("paymentMethod", e.target.value); if (e.target.value !== "credit") set("creditCardId", ""); }} />

      {form.paymentMethod === "credit" && (
        <Select label="Cartão de crédito"
          options={(cards ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.brand})` }))}
          placeholder="Selecione o cartão..." value={form.creditCardId}
          onChange={(e) => set("creditCardId", e.target.value)} error={errors.creditCardId} />
      )}

      {(form.paymentMethod === "pix" || form.paymentMethod === "debit") && accounts && accounts.length > 0 && (
        <Select label="Conta bancária (opcional)"
          options={[{ value: "", label: "Nenhuma" }, ...(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))]}
          value={form.bankAccountId}
          onChange={(e) => set("bankAccountId", e.target.value)} />
      )}

      {mutation.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {(mutation.error as Error).message}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={mutation.isPending} fullWidth>Salvar</Button>
      </div>
    </form>
  );
}
