import React, { useState } from "react";
import { Plus, Target, Trash2, Pencil, PlusCircle, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Select } from "../components/ui/FormFields";
import { Badge, EmptyState, PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useGoals, useCreateGoal, useUpdateGoal, useAddGoalContribution, useDeleteGoal } from "../hooks/useSprint3";
import { useUsers } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { FinancialGoal, CreateFinancialGoalDTO, GoalCategory, GOAL_CATEGORY_LABELS } from "../types";
import { formatCurrency, formatDate } from "../utils/formatters";

const CATEGORY_OPTIONS = Object.entries(GOAL_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));

function GoalForm({ initial, userId, onSave, onCancel, loading }: {
  initial?: FinancialGoal; userId: string;
  onSave: (data: CreateFinancialGoalDTO) => void; onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "", description: initial?.description ?? "",
    targetAmount: String(initial?.targetAmount ?? ""), currentAmount: String(initial?.currentAmount ?? "0"),
    deadline: initial?.deadline ? initial.deadline.split("T")[0] : "",
    category: (initial?.category ?? "savings") as GoalCategory,
    userId: initial?.userId ?? userId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: users } = useUsers();

  const set = (f: string, v: string) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: "" })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    if (!form.targetAmount || Number(form.targetAmount) <= 0) e.targetAmount = "Valor alvo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: form.title.trim(), description: form.description.trim() || undefined,
      targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || 0,
      deadline: form.deadline ? new Date(form.deadline + "T12:00:00").toISOString() : undefined,
      category: form.category, userId: form.userId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" placeholder="Ex: Viagem para Europa" value={form.title}
        onChange={(e) => set("title", e.target.value)} error={errors.title} />
      <Input label="Descrição (opcional)" placeholder="Detalhes do objetivo" value={form.description}
        onChange={(e) => set("description", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor alvo (R$)" type="number" min="1" step="0.01" placeholder="0,00"
          value={form.targetAmount} onChange={(e) => set("targetAmount", e.target.value)} error={errors.targetAmount} />
        <Input label="Valor já guardado (R$)" type="number" min="0" step="0.01" placeholder="0,00"
          value={form.currentAmount} onChange={(e) => set("currentAmount", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Categoria" options={CATEGORY_OPTIONS} value={form.category}
          onChange={(e) => set("category", e.target.value)} />
        <Input label="Prazo (opcional)" type="date" value={form.deadline}
          onChange={(e) => set("deadline", e.target.value)} />
      </div>
      <Select label="Titular" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
        value={form.userId} onChange={(e) => set("userId", e.target.value)} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={loading} fullWidth>Salvar</Button>
      </div>
    </form>
  );
}

export function GoalsPage() {
  const { currentUser } = useAuthStore();
  const { data: goals, isLoading, error } = useGoals();
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const contributeMutation = useAddGoalContribution();
  const deleteMutation = useDeleteGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<FinancialGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<FinancialGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null);

  const handleCreate = async (data: CreateFinancialGoalDTO) => { await createMutation.mutateAsync(data); setModalOpen(false); };
  const handleUpdate = async (data: CreateFinancialGoalDTO) => {
    if (!editGoal) return;
    await updateMutation.mutateAsync({ id: editGoal.id, data }); setEditGoal(null);
  };
  const handleContribute = async () => {
    if (!contributeGoal || !contributeAmount) return;
    await contributeMutation.mutateAsync({ id: contributeGoal.id, amount: Number(contributeAmount) });
    setContributeGoal(null); setContributeAmount("");
  };

  const totalTarget = (goals ?? []).reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = (goals ?? []).reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Objetivos Financeiros" subtitle="Metas de poupança, investimento e conquistas"
        action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>Novo Objetivo</Button>} />

      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white mb-6">
        <p className="text-sm text-emerald-100">Progresso geral dos objetivos</p>
        <div className="flex items-end gap-2 mt-1">
          <p className="text-4xl font-bold font-mono">{formatCurrency(totalCurrent)}</p>
          <p className="text-emerald-200 mb-1">de {formatCurrency(totalTarget)}</p>
        </div>
        <div className="h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all"
            style={{ width: `${totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0}%` }} />
        </div>
      </div>

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar objetivos." />}
      {goals && goals.length === 0 && (
        <EmptyState icon={<Target />} title="Nenhum objetivo cadastrado"
          description="Crie objetivos financeiros para acompanhar seu progresso ao longo do tempo."
          action={<Button onClick={() => setModalOpen(true)}>Criar objetivo</Button>} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(goals ?? []).map((goal) => (
          <Card key={goal.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{goal.title}</p>
                {goal.description && <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>}
              </div>
              <Badge variant={goal.isOnTrack ? "income" : "warning"}>
                {GOAL_CATEGORY_LABELS[goal.category]}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-mono">{formatCurrency(goal.currentAmount)}</span>
                <span className="font-mono">{formatCurrency(goal.targetAmount)}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${goal.progressPercent}%`,
                    backgroundColor: goal.progressPercent >= 100 ? "#10b981" : goal.isOnTrack ? "#0ea5e9" : "#f59e0b",
                  }} />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-center">{goal.progressPercent.toFixed(0)}% concluído</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 border-t border-slate-100 pt-3">
              <div><p className="text-slate-400">Falta</p><p className="font-semibold text-slate-700">{formatCurrency(goal.remainingAmount)}</p></div>
              {goal.deadline && (
                <div><p className="text-slate-400">Prazo</p><p className="font-semibold text-slate-700">{formatDate(goal.deadline)}</p></div>
              )}
              {goal.monthsToComplete !== null && goal.monthsToComplete > 0 && (
                <div className="col-span-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  <p className="text-slate-400">Conclusão estimada em {goal.monthsToComplete} mês(es)</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
              <button onClick={() => setContributeGoal(goal)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <PlusCircle className="w-3.5 h-3.5" />Contribuir
              </button>
              <button onClick={() => setEditGoal(goal)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" />Editar
              </button>
              <button onClick={() => setDeleteTarget(goal)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Excluir
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Objetivo" size="md">
        <GoalForm userId={currentUser?.id ?? ""} onSave={handleCreate} onCancel={() => setModalOpen(false)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Editar Objetivo" size="md">
        {editGoal && <GoalForm initial={editGoal} userId={editGoal.userId} onSave={handleUpdate} onCancel={() => setEditGoal(null)} loading={updateMutation.isPending} />}
      </Modal>
      <Modal isOpen={!!contributeGoal} onClose={() => setContributeGoal(null)} title="Adicionar Contribuição" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Quanto deseja adicionar a <strong>{contributeGoal?.title}</strong>?</p>
          <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
            value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setContributeGoal(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleContribute} loading={contributeMutation.isPending} fullWidth>Adicionar</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} title="Excluir objetivo"
        message={`Excluir o objetivo "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
