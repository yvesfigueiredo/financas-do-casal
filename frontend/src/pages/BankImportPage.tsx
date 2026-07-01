import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/FormFields";
import { EmptyState, PageLoader } from "../components/ui/Feedback";
import { useBankImport, useBankImports } from "../hooks/useSprint3";
import { useBankAccounts } from "../hooks/useBankAccounts";
import { useAuthStore } from "../stores/auth.store";
import { formatDate } from "../utils/formatters";

export function BankImportPage() {
  const { currentUser } = useAuthStore();
  const { data: accounts } = useBankAccounts();
  const { data: imports, isLoading } = useBankImports();
  const importMutation = useBankImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAccount, setSelectedAccount] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: a.name }));

  const handleFile = async (file: File) => {
    if (!selectedAccount) {
      alert("Selecione uma conta bancária primeiro");
      return;
    }
    const format = file.name.toLowerCase().endsWith(".ofx") ? "ofx" : "csv";
    const content = await file.text();

    const result = await importMutation.mutateAsync({
      bankAccountId: selectedAccount,
      format,
      content,
      filename: file.name,
      userId: currentUser?.id ?? "",
    });

    setLastResult({ imported: result.importedRows, duplicates: result.duplicateRows });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Importação Bancária" subtitle="Importe extratos OFX ou CSV automaticamente" />

      <Card className="mb-6">
        <CardHeader title="Nova Importação" />

        <Select label="Conta bancária de destino" options={accountOptions} placeholder="Selecione a conta..."
          value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={["mt-4 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors",
            dragOver ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-slate-300"].join(" ")}>
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Arraste um arquivo OFX ou CSV aqui</p>
          <p className="text-xs text-slate-400 mt-1">ou clique para selecionar</p>
          <input ref={fileInputRef} type="file" accept=".ofx,.csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {importMutation.isPending && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
            Processando arquivo...
          </div>
        )}

        {lastResult && !importMutation.isPending && (
          <div className="mt-4 flex items-center gap-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-emerald-700">{lastResult.imported} importada(s)</span>
              {lastResult.duplicates > 0 && (
                <span className="text-slate-500"> · {lastResult.duplicates} duplicata(s) ignorada(s)</span>
              )}
            </div>
          </div>
        )}

        {importMutation.error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {(importMutation.error as Error).message}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">
            Transações com mesma data, valor e descrição similar a lançamentos já existentes são automaticamente
            detectadas como duplicatas e ignoradas. A categoria é sugerida automaticamente com base em palavras-chave.
          </p>
        </div>
      </Card>

      {/* Histórico de importações */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Histórico de Importações</h3>
        </div>
        {isLoading && <div className="p-5"><PageLoader /></div>}
        {imports && imports.length === 0 && (
          <EmptyState icon={<FileText />} title="Nenhuma importação realizada" description="Suas importações aparecerão aqui." />
        )}
        {imports && imports.length > 0 && (
          <div className="divide-y divide-slate-50">
            {imports.map((imp) => (
              <div key={imp.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{imp.filename}</p>
                    <p className="text-xs text-slate-400">{formatDate(imp.createdAt)} · {imp.format.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-emerald-600 font-semibold">{imp.importedRows} importadas</p>
                  {imp.duplicateRows > 0 && <p className="text-slate-400">{imp.duplicateRows} duplicatas</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
