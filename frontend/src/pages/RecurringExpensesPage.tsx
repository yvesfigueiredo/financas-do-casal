import React, { useState } from "react";
import { Plus, Repeat, Trash2, Pencil, Power, RefreshCw } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Select } from "../components/ui/FormFields";
import { Badge, EmptyState, PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useRecurringExpenses, useCreateRecurringExpense, useUpdateRecurringExpense, useDeleteRecurringExpense, useGenerateRecurring } from "../hooks/useRecurringExpenses";
import { useActiveCreditCards } from "../hooks/useCreditCards";
import { useCategories, useUsers } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { RecurringExpense, CreateRecurringExpenseDTO, Periodicity, PERIODICITY_LABELS } from "../types";
import { formatCurrency, formatDate } from "../utils/formatters";

const PERIODICITIES = Object.entries(PERIODICITY_LABELS).map(([v, l]) => ({ value: v, label: l }));

function RecurringForm({ initial, userId, onSave, onCancel, loading }: {
  initial?: RecurringExpense; userId: string;
  onSave: (data: CreateRecurringExpenseDTO) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    description: initial?.description ?? "",
    amount: String(initial?.amount ?? ""),
    periodicity: (initial?.periodicity ?? "monthly") as Periodicity,
    dueDay: String(initial?.dueDay ?? ""),
    automaticDebit: initial?.automaticDebit ?? false,
    userId: initial?.userId ?? userId,
    categoryId: initial?.categoryId ?? "",
    creditCardId: initial?.creditCardId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: users } = useUsers();
  const { data: categories } = useCategories("expense");
  const { data: cards } = useActiveCreditCards(form.userId || undefined);

  const set = (f: string, v: string | boolean) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: "" })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = "Descrição obrigatória";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Valor inválido";
    if (!form.dueDay || Number(form.dueDay) < 1 || Number(form.dueDay) > 31) e.dueDay = "Dia inválido";
    if (!form.categoryId) e.categoryId = "Selecione a categoria";
    if (!form.userId) e.userId = "Selecione o usuário";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ description: form.description.trim(), amount: Number(form.amount),
      periodicity: form.periodicity, dueDay: Number(form.dueDay),
      automaticDebit: form.automaticDebit, userId: form.userId,
      categoryId: form.categoryId, creditCardId: form.creditCardId || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Descrição" placeholder="Ex: Aluguel, Internet..." value={form.description}
        onChange={(e) => set("description", e.target.value)} error={errors.description} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
          value={form.amount} onChange={(e) => set("amount", e.target.value)} error={errors.amount} />
        <Input label="Dia de vencimento" type="number" min="1" max="31" placeholder="Ex: 5"
          value={form.dueDay} onChange={(e) => set("dueDay", e.target.value)} error={errors.dueDay} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Periodicidade" options={PERIODICITIES} value={form.periodicity}
          onChange={(e) => set("periodicity", e.target.value)} />
        <Select label="Titular" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
          value={form.userId} onChange={(e) => set("userId", e.target.value)} error={errors.userId} />
      </div>
      <Select label="Categoria" options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Selecione..." value={form.categoryId}
        onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} />
      {cards && cards.length > 0 && (
        <Select label="Cartão vinculado (opcional)"
          options={[{ value: "", label: "Nenhum" }, ...(cards ?? []).map((c) => ({ value: c.id, label: c.name }))]}
          value={form.creditCardId} onChange={(e) => set("creditCardId", e.target.value)} />
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.automaticDebit}
          onChange={(e) => set("automaticDebit", e.target.checked)}
          className="w-4 h-4 rounded text-brand-600" />
        <span className="text-sm text-slate-700">Débito automático</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={loading} fullWidth>Salvar</Button>
      </div>
    </form>
  );
}

export function RecurringExpensesPage() {
  const { currentUser } = useAuthStore();
  const { data: expenses, isLoading, error } = useRecurringExpenses();
  const createMutation = useCreateRecurringExpense();
  const updateMutation = useUpdateRecurringExpense();
  const deleteMutation = useDeleteRecurringExpense();
  const generateMutation = useGenerateRecurring();

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);

  const totalMonthly = (expenses ?? [])
    .filter((e) => e.active && e.periodicity === "monthly")
    .reduce((s, e) => s + e.amount, 0);

  const handleCreate = async (data: CreateRecurringExpenseDTO) => {
    await createMutation.mutateAsync(data); setModalOpen(false);
  };
  const handleUpdate = async (data: CreateRecurringExpenseDTO) => {
    if (!editItem) return;
    await updateMutation.mutateAsync({ id: editItem.id, data }); setEditItem(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Contas Fixas" subtitle="Despesas recorrentes e automáticas"
        action={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}
              loading={generateMutation.isPending} onClick={() => generateMutation.mutate({})}>
              Gerar este mês
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
              Nova conta fixa
            </Button>
          </div>
        } />

      {/* Resumo */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-5 text-white mb-6">
        <p className="text-sm text-purple-200">Comprometimento mensal em contas fixas</p>
        <p className="text-4xl font-bold font-mono mt-1">{formatCurrency(totalMonthly)}</p>
        <p className="text-xs text-purple-300 mt-1">{(expenses ?? []).filter((e) => e.active).length} conta{(expenses ?? []).filter((e) => e.active).length !== 1 ? "s" : ""} ativa{(expenses ?? []).filter((e) => e.active).length !== 1 ? "s" : ""}</p>
      </div>

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar contas fixas." />}
      {expenses && expenses.length === 0 && (
        <EmptyState icon={<Repeat />} title="Nenhuma conta fixa cadastrada"
          description="Cadastre despesas recorrentes para controlar vencimentos automaticamente."
          action={<Button onClick={() => setModalOpen(true)}>Adicionar conta fixa</Button>} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(expenses ?? []).map((exp) => (
          <Card key={exp.id} className={["hover:shadow-md transition-shadow", !exp.active ? "opacity-60" : ""].join(" ")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{exp.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400">{exp.category?.name}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{exp.user?.name}</span>
                </div>
              </div>
              <Badge variant={exp.active ? "income" : "neutral"}>{exp.active ? "Ativa" : "Inativa"}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><p className="text-slate-400">Valor</p><p className="font-bold text-slate-800 text-base font-mono">{formatCurrency(exp.amount)}</p></div>
              <div><p className="text-slate-400">Periodicidade</p><p className="font-semibold text-slate-700">{PERIODICITY_LABELS[exp.periodicity]}</p></div>
              <div><p className="text-slate-400">Vencimento</p><p className="font-semibold text-slate-700">Dia {exp.dueDay}</p></div>
              <div><p className="text-slate-400">Próx. vencimento</p><p className="font-semibold text-red-600">{formatDate(exp.nextDueDate)}</p></div>
              {exp.lastGenerated && (
                <div className="col-span-2"><p className="text-slate-400">Última geração</p><p className="font-semibold text-slate-700">{formatDate(exp.lastGenerated)}</p></div>
              )}
              {exp.creditCard && (
                <div className="col-span-2"><p className="text-slate-400">Cartão</p><p className="font-semibold text-slate-700">{exp.creditCard.name}</p></div>
              )}
              {exp.automaticDebit && <div className="col-span-2"><Badge variant="info">Débito automático</Badge></div>}
            </div>

            <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
              <button onClick={() => setEditItem(exp)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" />Editar
              </button>
              <button onClick={() => updateMutation.mutate({ id: exp.id, data: { active: !exp.active } })}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                <Power className="w-3.5 h-3.5" />{exp.active ? "Pausar" : "Ativar"}
              </button>
              <button onClick={() => setDeleteTarget(exp)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Excluir
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Conta Fixa" size="md">
        <RecurringForm userId={currentUser?.id ?? ""} onSave={handleCreate} onCancel={() => setModalOpen(false)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Conta Fixa" size="md">
        {editItem && <RecurringForm initial={editItem} userId={editItem.userId} onSave={handleUpdate} onCancel={() => setEditItem(null)} loading={updateMutation.isPending} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} title="Excluir conta fixa"
        message={`Excluir "${deleteTarget?.description}"? Os lançamentos gerados serão mantidos.`}
        onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
