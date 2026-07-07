import { Bell, CheckCheck, X, RefreshCw } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { EmptyState, PageLoader } from "../components/ui/Feedback";
import { useAlerts, useMarkAlertsRead, useDismissAlerts } from "../hooks/useAlerts";
import { alertService } from "../services/alert.service";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertType } from "../types";
import { formatDate } from "../utils/formatters";

const ALERT_CONFIG: Record<AlertType, { label: string; color: string; bgColor: string }> = {
  bill_due_tomorrow:      { label: "Vencimento amanhã",   color: "#f59e0b", bgColor: "#fffbeb" },
  card_closing_tomorrow:  { label: "Fechamento amanhã",   color: "#8b5cf6", bgColor: "#f5f3ff" },
  invoice_due:            { label: "Fatura vence",        color: "#ef4444", bgColor: "#fef2f2" },
  negative_balance:       { label: "Saldo negativo",      color: "#ef4444", bgColor: "#fef2f2" },
  card_limit_high:        { label: "Limite alto",         color: "#f97316", bgColor: "#fff7ed" },
  recurring_unpaid:       { label: "Conta sem pagamento", color: "#f59e0b", bgColor: "#fffbeb" },
  installment_ending:     { label: "Parcela encerrando",  color: "#0ea5e9", bgColor: "#f0f9ff" },
};

function AlertCard({ alert, onRead, onDismiss }: {
  alert: Alert;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const config = ALERT_CONFIG[alert.type] ?? { label: alert.type, color: "#64748b", bgColor: "#f8fafc" };
  return (
    <div className={["rounded-xl border p-4 transition-all", !alert.read ? "border-l-4" : "border-slate-100 opacity-75"].join(" ")}
      style={!alert.read ? { borderLeftColor: config.color, backgroundColor: config.bgColor, borderColor: config.color + "40" } : {}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: config.color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ color: config.color, backgroundColor: config.bgColor }}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{alert.message}</p>
            {alert.dueDate && (
              <p className="text-xs text-slate-400 mt-1">Vence em: {formatDate(alert.dueDate)}</p>
            )}
            <p className="text-xs text-slate-300 mt-1">{formatDate(alert.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!alert.read && (
            <button onClick={onRead} title="Marcar como lido"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button onClick={onDismiss} title="Dispensar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertsPage() {
  const { data, isLoading } = useAlerts();
  const markReadMutation = useMarkAlertsRead();
  const dismissMutation = useDismissAlerts();
  const qc = useQueryClient();

  const alerts = data?.alerts ?? [];
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  const handleRunScan = async () => {
    await alertService.runScan();
    qc.invalidateQueries({ queryKey: ["alerts"] });
  };

  const handleMarkAllRead = async () => {
    const ids = unread.map((a) => a.id);
    if (ids.length) await markReadMutation.mutateAsync(ids);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title="Central de Alertas"
        subtitle={data?.unreadCount ? `${data.unreadCount} alerta${data.unreadCount !== 1 ? "s" : ""} não lido${data.unreadCount !== 1 ? "s" : ""}` : "Todos os alertas em dia"}
        action={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {unread.length > 0 && (
              <Button variant="outline" onClick={handleMarkAllRead} loading={markReadMutation.isPending}
                leftIcon={<CheckCheck className="w-4 h-4" />} fullWidth className="sm:w-auto">
                Marcar todos como lidos
              </Button>
            )}
            <Button variant="secondary" onClick={handleRunScan}
              leftIcon={<RefreshCw className="w-4 h-4" />} fullWidth className="sm:w-auto">
              Verificar alertas
            </Button>
          </div>
        } />

      {isLoading && <PageLoader />}

      {!isLoading && alerts.length === 0 && (
        <EmptyState icon={<Bell />} title="Nenhum alerta"
          description="Tudo em ordem! Clique em 'Verificar alertas' para escanear o sistema."
          action={<Button onClick={handleRunScan}>Verificar agora</Button>} />
      )}

      {unread.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Não lidos ({unread.length})
          </h2>
          <div className="space-y-3">
            {unread.map((alert) => (
              <AlertCard key={alert.id} alert={alert}
                onRead={() => markReadMutation.mutate([alert.id])}
                onDismiss={() => dismissMutation.mutate([alert.id])} />
            ))}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Lidos ({read.length})
          </h2>
          <div className="space-y-3">
            {read.map((alert) => (
              <AlertCard key={alert.id} alert={alert}
                onRead={() => {}}
                onDismiss={() => dismissMutation.mutate([alert.id])} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
