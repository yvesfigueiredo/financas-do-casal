import React, { useState } from "react";
import { FlaskConical, TrendingDown, CheckCircle, Save, Scale, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/FormFields";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/Feedback";
import { useSimulation } from "../hooks/useDashboard";
import { useActiveCreditCards } from "../hooks/useCreditCards";
import { useCreateTransaction } from "../hooks/useTransactions";
import { useCreateInstallment } from "../hooks/useTransactions";
import { useCreateRecurringExpense } from "../hooks/useRecurringExpenses";
import { useUsers } from "../hooks/useUsers";
import { useCategories } from "../hooks/useUsers";
import { useAuthStore } from "../stores/auth.store";
import { useScenarios, useSaveScenario, useDeleteScenario } from "../hooks/useSprint3";
import { SimulationInput, SimulationResult, Periodicity, PERIODICITY_LABELS } from "../types";
import { formatCurrency } from "../utils/formatters";

type SimType = "purchase" | "installment" | "recurring";

const SIM_TYPES: { value: SimType; label: string; desc: string }[] = [
  { value: "purchase", label: "Compra à vista", desc: "Impacto imediato no saldo" },
  { value: "installment", label: "Compra parcelada", desc: "Distribuída em meses" },
  { value: "recurring", label: "Conta fixa", desc: "Recorrência periódica" },
];

const PERIODICITIES = Object.entries(PERIODICITY_LABELS).map(([v, l]) => ({ value: v, label: l }));

export function SimulatorPage() {
  const { currentUser } = useAuthStore();
  const { data: cards } = useActiveCreditCards();
  const { data: users } = useUsers();
  const { data: categories } = useCategories("expense");
  const simulateMutation = useSimulation();
  const createTxMutation = useCreateTransaction();
  const createInstMutation = useCreateInstallment();
  const createRecMutation = useCreateRecurringExpense();

  const [simType, setSimType] = useState<SimType>("purchase");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    installmentCount: "6",
    startDate: new Date().toISOString().split("T")[0],
    periodicity: "monthly" as Periodicity,
    creditCardId: "",
    userId: currentUser?.id ?? "",
    categoryId: "",
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const { data: scenarios } = useScenarios();
  const saveScenarioMutation = useSaveScenario();
  const deleteScenarioMutation = useDeleteScenario();

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSimulate = async () => {
    const input: SimulationInput = {
      type: simType,
      description: form.description || "Simulação",
      amount: Number(form.amount),
      installmentCount: simType === "installment" ? Number(form.installmentCount) : undefined,
      startDate: form.startDate,
      periodicity: simType === "recurring" ? form.periodicity : undefined,
      creditCardId: form.creditCardId || undefined,
    };
    const res = await simulateMutation.mutateAsync(input);
    setResult(res);
    setConfirmed(false);
  };

  const handleConfirm = async () => {
    if (!result) return;
    const userId = form.userId || currentUser?.id || "";
    const categoryId = form.categoryId || (categories?.[0]?.id ?? "");

    if (simType === "purchase") {
      await createTxMutation.mutateAsync({
        description: form.description,
        amount: Number(form.amount),
        type: "expense",
        date: new Date(form.startDate + "T12:00:00").toISOString(),
        paymentMethod: form.creditCardId ? "credit" : "cash",
        userId,
        categoryId,
        creditCardId: form.creditCardId || undefined,
      });
    } else if (simType === "installment") {
      await createInstMutation.mutateAsync({
        description: form.description,
        totalAmount: Number(form.amount),
        installmentCount: Number(form.installmentCount),
        startDate: new Date(form.startDate + "T12:00:00").toISOString(),
        paymentMethod: "credit",
        userId,
        categoryId,
        creditCardId: form.creditCardId || undefined,
      });
    } else {
      await createRecMutation.mutateAsync({
        description: form.description,
        amount: Number(form.amount),
        periodicity: form.periodicity,
        dueDay: new Date(form.startDate).getDate(),
        automaticDebit: false,
        userId,
        categoryId,
        creditCardId: form.creditCardId || undefined,
      });
    }

    setConfirmed(true);
  };

  const handleSaveScenario = async () => {
    if (!result || !scenarioName.trim()) return;
    await saveScenarioMutation.mutateAsync({
      name: scenarioName.trim(),
      input: result.input,
      result,
      userId: currentUser?.id ?? "",
    });
    setSaveModalOpen(false);
    setScenarioName("");
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].slice(-3));
  };

  const cardOptions = [
    { value: "", label: "Nenhum" },
    ...(cards ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.brand})` })),
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader title="Simulador Financeiro"
        subtitle="Simule o impacto antes de confirmar qualquer gasto"
        action={
          (scenarios?.length ?? 0) > 0 ? (
            <Button variant="outline" leftIcon={<Scale className="w-4 h-4" />} onClick={() => setCompareModalOpen(true)}>
              Comparar Cenários
            </Button>
          ) : undefined
        } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de configuração */}
        <div className="space-y-4">
          {/* Tipo de simulação */}
          <Card>
            <CardHeader title="Tipo de operação" />
            <div className="space-y-2">
              {SIM_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setSimType(t.value)}
                  className={["w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                    simType === t.value ? "border-brand-400 bg-brand-50" : "border-slate-100 hover:border-slate-200"].join(" ")}>
                  <div className={["w-4 h-4 rounded-full border-2 flex-shrink-0",
                    simType === t.value ? "border-brand-500 bg-brand-500" : "border-slate-300"].join(" ")} />
                  <div>
                    <p className={["text-sm font-semibold", simType === t.value ? "text-brand-700" : "text-slate-700"].join(" ")}>{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Formulário */}
          <Card>
            <CardHeader title="Detalhes" />
            <div className="space-y-3">
              <Input label="Descrição" placeholder="Ex: iPhone 16, Seguro..." value={form.description}
                onChange={(e) => set("description", e.target.value)} />
              <Input label="Valor (R$)" type="number" min="0.01" step="0.01" placeholder="0,00"
                value={form.amount} onChange={(e) => set("amount", e.target.value)} />

              {simType === "installment" && (
                <Input label="Número de parcelas" type="number" min="2" max="120"
                  value={form.installmentCount} onChange={(e) => set("installmentCount", e.target.value)} />
              )}

              {simType === "recurring" && (
                <Select label="Periodicidade" options={PERIODICITIES} value={form.periodicity}
                  onChange={(e) => set("periodicity", e.target.value as Periodicity)} />
              )}

              <Input label={simType === "installment" ? "Data da 1ª parcela" : "Data"} type="date"
                value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />

              <Select label="Cartão (opcional)" options={cardOptions} value={form.creditCardId}
                onChange={(e) => set("creditCardId", e.target.value)} />

              {users && users.length > 0 && (
                <Select label="Titular" options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
                  value={form.userId} onChange={(e) => set("userId", e.target.value)} />
              )}

              {categories && categories.length > 0 && (
                <Select label="Categoria" options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Selecione..." value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)} />
              )}

              <Button fullWidth onClick={handleSimulate} loading={simulateMutation.isPending}
                disabled={!form.amount || Number(form.amount) <= 0}
                leftIcon={<FlaskConical className="w-4 h-4" />}>
                Simular
              </Button>
            </div>
          </Card>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {!result && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-slate-300">
                <FlaskConical className="w-16 h-16 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Configure a simulação e clique em Simular</p>
                <p className="text-sm text-slate-300 mt-1">O impacto será exibido aqui</p>
              </div>
            </Card>
          )}

          {result && (
            <>
              {/* Resumo do impacto */}
              <Card className="border-l-4 border-l-orange-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto total</p>
                    <p className="text-3xl font-bold text-red-600 font-mono mt-1">{formatCurrency(result.totalImpact)}</p>
                    <p className="text-xs text-slate-400 mt-1">{result.input.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSaveModalOpen(true)} title="Salvar cenário"
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                      <Save className="w-5 h-5" />
                    </button>
                    <TrendingDown className="w-8 h-8 text-orange-400" />
                  </div>
                </div>

                {result.cardImpact && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Impacto no cartão <strong>{result.cardImpact.cardName}</strong></p>
                    <div className="flex gap-4 mt-1">
                      <div><p className="text-xs text-slate-400">Novo utilizado</p><p className="text-sm font-bold text-red-600 font-mono">{formatCurrency(result.cardImpact.newUsed)}</p></div>
                      <div><p className="text-xs text-slate-400">Novo disponível</p><p className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(result.cardImpact.newAvailable)}</p></div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Gráfico de impacto mensal */}
              <Card>
                <CardHeader title="Impacto por Mês" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.monthlyImpact.filter((m) => m.impact > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => v.split(" ")[0].substring(0, 3)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Impacto"]} />
                    <Bar dataKey="impact" name="Impacto" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Saldo projetado */}
              <Card padding="none">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">Saldo projetado com esse gasto</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {result.monthlyImpact.slice(0, 12).map((m) => (
                    <div key={`${m.year}-${m.month}`}
                      className="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0 text-xs">
                      <span className="text-slate-600">{m.monthLabel}</span>
                      <span className="text-red-500 font-mono">-{formatCurrency(m.impact)}</span>
                      <span className={["font-mono font-semibold",
                        m.projectedBalance >= 0 ? "text-slate-700" : "text-red-600"].join(" ")}>
                        {formatCurrency(m.projectedBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Confirmar ou já confirmado */}
              {confirmed ? (
                <Card className="border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Confirmado e gravado!</p>
                      <p className="text-xs text-emerald-600 mt-0.5">O lançamento foi criado com sucesso.</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Button fullWidth variant="primary" onClick={handleConfirm}
                  loading={createTxMutation.isPending || createInstMutation.isPending || createRecMutation.isPending}>
                  Confirmar e gravar lançamento
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal: Salvar cenário */}
      <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Salvar Cenário" size="sm">
        <div className="space-y-4">
          <Input label="Nome do cenário" placeholder="Ex: Compra do notebook em 10x"
            value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSaveModalOpen(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleSaveScenario} loading={saveScenarioMutation.isPending}
              disabled={!scenarioName.trim()} fullWidth>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Comparar cenários */}
      <Modal isOpen={compareModalOpen} onClose={() => { setCompareModalOpen(false); setCompareIds([]); }}
        title="Comparador de Cenários" size="xl">
        {!scenarios || scenarios.length === 0 ? (
          <EmptyState icon={<Scale />} title="Nenhum cenário salvo"
            description="Simule e salve cenários para compará-los aqui." />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Selecione até 3 cenários para comparar lado a lado.</p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scenarios.map((s) => (
                <label key={s.id}
                  className={["flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all",
                    compareIds.includes(s.id) ? "border-brand-400 bg-brand-50" : "border-slate-100 hover:border-slate-200"].join(" ")}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={compareIds.includes(s.id)} onChange={() => toggleCompare(s.id)}
                      className="w-4 h-4 rounded text-brand-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.input?.description}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); deleteScenarioMutation.mutate(s.id); }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </label>
              ))}
            </div>

            {compareIds.length >= 2 && (
              <div className="border-t border-slate-100 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={compareIds.map((id) => {
                    const s = scenarios.find((sc) => sc.id === id);
                    return { name: s?.name?.substring(0, 15) ?? "—", impacto: s?.result?.totalImpact ?? 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Impacto Total"]} />
                    <Legend />
                    <Bar dataKey="impacto" name="Impacto Total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: `repeat(${compareIds.length}, 1fr)` }}>
                  {compareIds.map((id) => {
                    const s = scenarios.find((sc) => sc.id === id);
                    return (
                      <div key={id} className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 truncate">{s?.name}</p>
                        <p className="text-sm font-bold text-red-600 font-mono">{formatCurrency(s?.result?.totalImpact ?? 0)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
