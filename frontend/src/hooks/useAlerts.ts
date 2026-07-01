import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertService } from "../services/alert.service";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: alertService.getAll,
    staleTime: 1000 * 60,
  });
}

export function useMarkAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => alertService.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDismissAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => alertService.dismiss(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
