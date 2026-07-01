import React, { useState } from "react";
import { Plus, Landmark, ArrowLeftRight, Trash2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input, Select } from "../components/ui/FormFields";
import { EmptyState, PageLoader, ErrorMessage } from "../components/ui/Feedback";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useBankAccounts, useCreateBankAccount, useDeleteBankAccount, useCreateTransfer, useTransfers } from "../hooks/useBankAccounts";
import { useUsers } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { BankAccount, AccountType, CreateBankAccountDTO, CreateTransferDTO, ACCOUNT_TYPE_LABELS } from "../types";
import { formatCurrency, formatDate } from "../utils/formatters";

const PRESET_COLORS = ["#820AD1","#003087","#FF8700","#00A651","#EF4444","#3B82F6","#F9C900","#8B5CF6"];

const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function BankAccountsPage() {
  const { currentUser } = useAuthStore();
  const { data: accounts, isLoading, error } = useBankAccounts();
  const { data: transfers } = useTransfers();
  const createMutation = useCreateBankAccount();
  const deleteMutation = useDeleteBankAccount();
  const transferMutation = useCreateTransfer();

  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  // Form novo conta
  const [form, setForm] = useState({ name: "", type: "digital" as AccountType, initialBalance: "", color: "#820AD1", userId: currentUser?.id ?? "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: users } = useUsers();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome obrigatório";
    if (isNaN(Number(form.initialBalance))) errs.initialBalance = "Valor inválido";
    if (!form.userId) errs.userId = "Selecione o titular";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const data: CreateBankAccountDTO = { name: form.name.trim(), type: form.type, initialBalance: Number(form.initialBalance) || 0, color: form.color, userId: form.userId };
    await createMutation.mutateAsync(data);
    setModalOpen(false);
    setForm({ name: "", type: "digital", initialBalance: "", color: "#820AD1", userId: currentUser?.id ?? "" });
  };

  // Form transferência
  const [tForm, setTForm] = useState({ fromAccountId: "", toAccountId: "", amount: "", description: "Transferência", date: new Date().toISOString().split("T")[0] });
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateTransferDTO = { fromAccountId: tForm.fromAccountId, toAccountId: tForm.toAccountId, amount: Number(tForm.amount), description: tForm.description, date: new Date(tForm.date + "T12:00:00").toISOString() };
    await transferMutation.mutateAsync(data);
    setTransferModalOpen(false);
  };

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.currentBalance)})` }));
  const totalBalance = (accounts ?? []).reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Contas Bancárias" subtitle="Saldos, entradas e saídas por conta"
        action={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<ArrowLeftRight className="w-4 h-4" />} onClick={() => setTransferModalOpen(true)}>Transferir</Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>Nova Conta</Button>
          </div>
        } />

      {/* Card total */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-5 text-white mb-6">
        <p className="text-sm text-brand-200 font-medium">Saldo Total Consolidado</p>
        <p className="text-4xl font-bold font-mono mt-1">{formatCurrency(totalBalance)}</p>
        <p className="text-xs text-brand-300 mt-1">{(accounts ?? []).length} conta{(accounts ?? []).length !== 1 ? "s" : ""} ativa{(accounts ?? []).length !== 1 ? "s" : ""}</p>
      </div>

      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Erro ao carregar contas." />}

      {accounts && accounts.length === 0 && (
        <EmptyState icon={<Landmark />} title="Nenhuma conta cadastrada"
          description="Cadastre suas contas bancárias para controlar entradas e saídas."
          action={<Button onClick={() => setModalOpen(true)}>Adicionar conta</Button>} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {(accounts ?? []).map((account) => (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: account.color + "20" }}>
                  <Landmark className="w-5 h-5" style={{ color: account.color }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{account.name}</p>
                  <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[account.type as AccountType]} · {account.user?.name}</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(account)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center py-2 mb-3">
              <p className="text-xs text-slate-400">Saldo atual</p>
              <p className={["text-2xl font-bold font-mono", account.currentBalance >= 0 ? "text-emerald-600" : "text-red-600"].join(" ")}>
                {formatCurrency(account.currentBalance)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
              <div><p className="text-slate-400">Entradas</p><p className="font-semibold text-emerald-600">+{formatCurrency(account.totalIn)}</p></div>
              <div><p className="text-slate-400">Saídas</p><p className="font-semibold text-red-600">-{formatCurrency(account.totalOut)}</p></div>
              <div><p className="text-slate-400">Transf. recebidas</p><p className="font-semibold text-slate-700">+{formatCurrency(account.totalTransferIn)}</p></div>
              <div><p className="text-slate-400">Transf. enviadas</p><p className="font-semibold text-slate-700">-{formatCurrency(account.totalTransferOut)}</p></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Histórico de transferências */}
      {transfers && transfers.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Transferências</h2>
          <div className="space-y-2">
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t.description}</p>
                    <p className="text-xs text-slate-400">{t.fromAccount?.name} → {t.toAccount?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal nova conta */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Conta Bancária" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Nubank Conta" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" options={ACCOUNT_TYPES} value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AccountType }))} />
            <Input label="Saldo inicial (R$)" type="number" step="0.01" placeholder="0,00"
              value={form.initialBalance} onChange={(e) => setForm((p) => ({ ...p, initialBalance: e.target.value }))} error={formErrors.initialBalance} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Cor</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={["w-8 h-8 rounded-lg border-2 transition-all", form.color === c ? "border-slate-900 scale-110" : "border-transparent"].join(" ")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <Select label="Titular" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
            value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} error={formErrors.userId} />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending} fullWidth>Criar conta</Button>
          </div>
        </form>
      </Modal>

      {/* Modal transferência */}
      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transferência entre Contas" size="md">
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select label="De" options={accountOptions} placeholder="Conta de origem..." value={tForm.fromAccountId}
            onChange={(e) => setTForm((p) => ({ ...p, fromAccountId: e.target.value }))} />
          <Select label="Para" options={accountOptions} placeholder="Conta de destino..." value={tForm.toAccountId}
            onChange={(e) => setTForm((p) => ({ ...p, toAccountId: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
              value={tForm.amount} onChange={(e) => setTForm((p) => ({ ...p, amount: e.target.value }))} />
            <Input label="Data" type="date" value={tForm.date}
              onChange={(e) => setTForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          <Input label="Descrição" value={tForm.description}
            onChange={(e) => setTForm((p) => ({ ...p, description: e.target.value }))} />
          {transferMutation.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {(transferMutation.error as Error).message}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)} fullWidth>Cancelar</Button>
            <Button type="submit" loading={transferMutation.isPending} fullWidth>Transferir</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} title="Excluir conta"
        message={`Excluir a conta "${deleteTarget?.name}"? Os lançamentos vinculados serão mantidos.`}
        onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
