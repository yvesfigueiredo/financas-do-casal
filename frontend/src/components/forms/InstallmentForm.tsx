import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/FormFields";
import { useCategories, useUsers } from "../../hooks/useUsers";
import { useCreateInstallment } from "../../hooks/useTransactions";
import { useActiveCreditCards } from "../../hooks/useCreditCards";
import { CreateInstallmentDTO } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface Props { defaultUserId?: string; onSuccess: () => void; onCancel: () => void; }

interface FormState {
  description: string; totalAmount: string; installmentCount: string;
  startDate: string; userId: string; categoryId: string; creditCardId: string;
}

export function InstallmentForm({ defaultUserId = "", onSuccess, onCancel }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<FormState>({
    description: "", totalAmount: "", installmentCount: "2",
    startDate: today, userId: defaultUserId, categoryId: "", creditCardId: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: users } = useUsers();
  const { data: categories } = useCategories("expense");
  const { data: cards } = useActiveCreditCards(form.userId || undefined);
  const mutation = useCreateInstallment();

  const totalAmount = Number(form.totalAmount);
  const installmentCount = Number(form.installmentCount);
  const installmentValue = totalAmount > 0 && installmentCount >= 2
    ? Math.round((totalAmount / installmentCount) * 100) / 100 : 0;

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = "Informe a descrição";
    if (!form.totalAmount || totalAmount <= 0) e.totalAmount = "Informe um valor válido";
    if (!form.installmentCount || installmentCount < 2 || installmentCount > 120)
      e.installmentCount = "Entre 2 e 120 parcelas";
    if (!form.startDate) e.startDate = "Informe a data";
    if (!form.userId) e.userId = "Selecione o usuário";
    if (!form.categoryId) e.categoryId = "Selecione a categoria";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const data: CreateInstallmentDTO = {
      description: form.description.trim(), totalAmount, installmentCount,
      startDate: new Date(form.startDate + "T12:00:00").toISOString(),
      paymentMethod: "credit",
      userId: form.userId, categoryId: form.categoryId,
      creditCardId: form.creditCardId || undefined,
    };
    try { await mutation.mutateAsync(data); onSuccess(); } catch { /* handled by mutation.error */ }
  };

  const set = (field: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Descrição" placeholder="Ex: Notebook Dell, Geladeira..."
        value={form.description} onChange={(e) => set("description", e.target.value)}
        error={errors.description} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Valor total (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
          value={form.totalAmount} onChange={(e) => set("totalAmount", e.target.value)}
          error={errors.totalAmount} />
        <Input label="Nº de parcelas" type="number" min="2" max="120" placeholder="Ex: 10"
          value={form.installmentCount} onChange={(e) => set("installmentCount", e.target.value)}
          error={errors.installmentCount} />
      </div>

      {installmentValue > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-700 font-medium">Valor por parcela</p>
            <p className="text-lg font-bold text-brand-800 font-mono">{formatCurrency(installmentValue)}</p>
          </div>
          <p className="text-xs text-brand-500 mt-1">
            {installmentCount}× {formatCurrency(installmentValue)}
          </p>
        </div>
      )}

      <Input label="Data da 1ª parcela" type="date" value={form.startDate}
        onChange={(e) => set("startDate", e.target.value)} error={errors.startDate}
        hint="As demais parcelas serão criadas nos meses seguintes" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Pessoa" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
          placeholder="Selecione..." value={form.userId}
          onChange={(e) => { set("userId", e.target.value); set("creditCardId", ""); }}
          error={errors.userId} />
        <Select label="Categoria"
          options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Selecione..." value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} />
      </div>

      {cards && cards.length > 0 && (
        <Select label="Cartão de crédito (opcional)"
          options={[{ value: "", label: "Nenhum" }, ...(cards ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.brand})` }))]}
          value={form.creditCardId} onChange={(e) => set("creditCardId", e.target.value)} />
      )}

      {mutation.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {(mutation.error as Error).message}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={mutation.isPending} fullWidth>
          Criar {installmentCount} parcelas
        </Button>
      </div>
    </form>
  );
}
