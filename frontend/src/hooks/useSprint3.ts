import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  healthScoreService, assistantService, goalService, projectionService,
  emergencyReserveService, timelineService, scenarioService, bankImportService,
  executiveDashboardService,
} from "../services/sprint3.service";
import { CreateFinancialGoalDTO, UpdateFinancialGoalDTO, SaveScenarioDTO } from "../types";

export function useHealthScore(userId?: string) {
  return useQuery({
    queryKey: ["health-score", userId],
    queryFn: () => healthScoreService.get(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialInsights(userId?: string) {
  return useQuery({
    queryKey: ["insights", userId],
    queryFn: () => assistantService.getInsights(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoals(userId?: string) {
  return useQuery({
    queryKey: ["goals", userId],
    queryFn: () => goalService.getAll(userId),
    staleTime: 1000 * 30,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinancialGoalDTO) => goalService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinancialGoalDTO }) => goalService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useAddGoalContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => goalService.addContribution(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["executive-dashboard"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useProjection(months: 6 | 12 | 24 | 36, userId?: string) {
  return useQuery({
    queryKey: ["projection", months, userId],
    queryFn: () => projectionService.get(months, userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmergencyReserve(userId?: string) {
  return useQuery({
    queryKey: ["emergency-reserve", userId],
    queryFn: () => emergencyReserveService.get(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTimeline(days?: number, userId?: string) {
  return useQuery({
    queryKey: ["timeline", days, userId],
    queryFn: () => timelineService.get(days, userId),
    staleTime: 1000 * 60,
  });
}

export function useScenarios(userId?: string) {
  return useQuery({
    queryKey: ["scenarios", userId],
    queryFn: () => scenarioService.getAll(userId),
    staleTime: 1000 * 30,
  });
}

export function useSaveScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveScenarioDTO) => scenarioService.save(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scenarioService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios"] }),
  });
}

export function useCompareScenarios(ids: string[]) {
  return useQuery({
    queryKey: ["scenario-compare", ids],
    queryFn: () => scenarioService.compare(ids),
    enabled: ids.length > 0,
  });
}

export function useBankImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bankImportService.import,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["bank-imports"] });
    },
  });
}

export function useBankImports(bankAccountId?: string) {
  return useQuery({
    queryKey: ["bank-imports", bankAccountId],
    queryFn: () => bankImportService.getAll(bankAccountId),
  });
}

export function useExecutiveDashboard(userId?: string) {
  return useQuery({
    queryKey: ["executive-dashboard", userId],
    queryFn: () => executiveDashboardService.get(userId),
    staleTime: 1000 * 60 * 2,
  });
}
