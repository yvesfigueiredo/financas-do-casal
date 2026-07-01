import React, { useState } from "react";
import { Plus, Pencil, Trash2, Power, CreditCard } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Select } from "../components/ui/FormFields";
import { Badge, EmptyState, PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useCreditCards, useCreateCreditCard, useUpdateCreditCard, useToggleCreditCard, useDeleteCreditCard } from "../hooks/useCreditCards";
import { useUsers } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { CreditCard as CreditCardType, CardBrand, CreateCreditCardDTO } from "../types";
import { formatCurrency, formatPercent } from "../utils/formatters";

const BRANDS: CardBrand[] = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outro"];
const PRESET_COLORS = ["#820AD1","#003087","#FF8700","#00A651","#EF4444","#3B82F6","#F59E0B","#8B5CF6"];

function CardForm({ initial, userId, onSave, onCancel, loading }: {
  initial?: Partial<CreditCardType>; userId: string;
  onSave: (data: CreateCreditCardDTO) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "", brand: initial?.brand ?? "Visa" as CardBrand,
    color: initial?.color ?? "#820AD1", limit: String(initial?.limit ?? ""),
    closingDay: String(initial?.closingDay ?? ""), dueDay: String(initial?.dueDay ?? ""),
    userId: initial?.userId ?? userId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: users } = useUsers();

  const set = (f: string, v: string) => {
    setForm((p) => ({ ...p, [f]: v }));
    setErrors((p) => ({ ...p, [f]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome";
    if (!form.limit || Number(form.limit) <= 0) e.limit = "Informe o limite";
    if (!form.closingDay || Number(form.closingDay) < 1 || Number(form.closingDay) > 31) e.closingDay = "Dia inválido";
    if (!form.dueDay || Number(form.dueDay) < 1 || Number(form.dueDay) > 31) e.dueDay = "Dia inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: form.name.trim(), brand: form.brand, color: form.color,
      limit: Number(form.limit), closingDay: Number(form.closingDay),
      dueDay: Number(form.dueDay), userId: form.userId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nome do cartão" placeholder="Ex: Nubank" value={form.name}
          onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Select label="Bandeira" options={BRANDS.map((b) => ({ value: b, label: b }))}
          value={form.brand} onChange={(e) => set("brand", e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 mb-1.5">Cor</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => set("color", c)}
              className={["w-8 h-8 rounded-lg border-2 transition-all", form.color === c ? "border-slate-900 scale-110" : "border-transparent"].join(" ")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <Input label="Limite (R$)" type="number" min="1" step="0.01" placeholder="0,00"
        value={form.limit} onChange={(e) => set("limit", e.target.value)} error={errors.limit} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Dia de fechamento" type="number" min="1" max="31" placeholder="Ex: 3"
          value={form.closingDay} onChange={(e) => set("closingDay", e.target.value)} error={errors.closingDay} />
        <Input label="Dia de vencimento" type="number" min="1" max="31" placeholder="Ex: 10"
          value={form.dueDay} onChange={(e) => set("dueDay", e.target.value)} error={errors.dueDay} />
      </div>
      <Select label="Titular"
        options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
        value={form.userId} onChange={(e) => set("userId", e.target.value)} />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={loading} fullWidth>Salvar</Button>
      </div>
    </form>
  );
}

export function CreditCardsPage() {
  const { currentUser } = useAuthStore();
  const { data: cards, isLoading, error } = useCreditCards();
  const createMutation = useCreateCreditCard();
  const updateMutation = useUpdateCreditCard();
  const toggleMutation = useToggleCreditCard();
  const deleteMutation = useDeleteCreditCard();

  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<CreditCardType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditCardType | null>(null);

  const handleCreate = async (data: CreateCreditCardDTO) => {
    await createMutation.mutateAsync(data);
    setModalOpen(false);
  };

  const handleUpdate = async (data: CreateCreditCardDTO) => {
    if (!editCard) return;
    await updateMutation.mutateAsync({ id: editCard.id, data });
    setEditCard(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Cartões de Crédito" subtitle="Gerencie seus cartões e acompanhe faturas"
        action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>Novo Cartão</Button>} />

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar cartões." />}

      {cards && cards.length === 0 && (
        <EmptyState icon={<CreditCard />} title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões para acompanhar faturas e gastos."
          action={<Button onClick={() => setModalOpen(true)}>Adicionar cartão</Button>} />
      )}

      {cards && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className={["transition-all hover:shadow-md", !card.active ? "opacity-60" : ""].join(" ")}>
              {/* Header do cartão */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + "20" }}>
                    <CreditCard className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{card.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">{card.brand}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400">{card.user?.name}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={card.active ? "income" : "neutral"}>{card.active ? "Ativo" : "Inativo"}</Badge>
              </div>

              {/* Limite */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Utilizado: {formatCurrency(card.used)}</span>
                  <span>{formatPercent(card.usagePercent)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, card.usagePercent)}%`,
                      backgroundColor: card.usagePercent >= 80 ? "#ef4444" : card.usagePercent >= 60 ? "#f59e0b" : card.color,
                    }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-emerald-600">Disponível: {formatCurrency(card.available)}</span>
                  <span className="text-slate-400">Limite: {formatCurrency(card.limit)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3 mb-3">
                <div><p className="text-slate-400">Fechamento</p><p className="font-semibold text-slate-700">Dia {card.closingDay}</p></div>
                <div><p className="text-slate-400">Vencimento</p><p className="font-semibold text-slate-700">Dia {card.dueDay}</p></div>
                <div><p className="text-slate-400">Compras</p><p className="font-semibold text-slate-700">{card.purchaseCount}</p></div>
                <div><p className="text-slate-400">Próx. fatura</p><p className="font-semibold text-red-600">{formatCurrency(card.nextInvoiceAmount)}</p></div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                <button onClick={() => setEditCard(card)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />Editar
                </button>
                <button onClick={() => toggleMutation.mutate(card.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                  <Power className="w-3.5 h-3.5" />{card.active ? "Inativar" : "Ativar"}
                </button>
                <button onClick={() => setDeleteTarget(card)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Excluir
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Cartão" size="md">
        <CardForm userId={currentUser?.id ?? ""} onSave={handleCreate} onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editCard} onClose={() => setEditCard(null)} title="Editar Cartão" size="md">
        {editCard && (
          <CardForm initial={editCard} userId={editCard.userId} onSave={handleUpdate}
            onCancel={() => setEditCard(null)} loading={updateMutation.isPending} />
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} title="Excluir cartão"
        message={`Excluir o cartão "${deleteTarget?.name}"? Os lançamentos vinculados serão mantidos.`}
        onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
