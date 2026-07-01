import { useQuery } from "@tanstack/react-query";
import { installmentService } from "../services/dashboard.service";

export function useInstallments() {
  return useQuery({
    queryKey: ["installments"],
    queryFn: installmentService.getAll,
    staleTime: 1000 * 30,
  });
}

export function useInstallment(id: string) {
  return useQuery({
    queryKey: ["installments", id],
    queryFn: () => installmentService.getById(id),
    enabled: !!id,
  });
}
