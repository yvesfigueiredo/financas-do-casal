import { useMutation, useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import { DashboardFilters, SimulationInput } from "../types";

export function useDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => dashboardService.getSummary(filters),
    staleTime: 1000 * 60,
    enabled: !!filters.month && !!filters.year,
  });
}

export function useAnnualSummary(year?: number, userId?: string) {
  return useQuery({
    queryKey: ["dashboard-annual", year, userId],
    queryFn: () => dashboardService.getAnnual(year, userId),
    staleTime: 1000 * 60 * 5,
    enabled: !!year,
  });
}

export function useCashFlow(userId?: string) {
  return useQuery({
    queryKey: ["cashflow", userId],
    queryFn: () => dashboardService.getCashFlow(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSimulation() {
  return useMutation({
    mutationFn: (input: SimulationInput) => dashboardService.simulate(input),
  });
}
