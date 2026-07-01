import api from "./api";
import {
  AnnualSummary,
  CashFlowMonth,
  DashboardFilters,
  DashboardSummary,
  Installment,
  SimulationInput,
  SimulationResult,
} from "../types";

export const dashboardService = {
  getSummary: async (filters: DashboardFilters): Promise<DashboardSummary> => {
    const response = await api.get("/dashboard", { params: filters });
    return response.data.data;
  },
  getAnnual: async (year?: number, userId?: string): Promise<AnnualSummary> => {
    const response = await api.get("/dashboard/annual", { params: { year, userId } });
    return response.data.data;
  },
  getCashFlow: async (userId?: string): Promise<CashFlowMonth[]> => {
    const response = await api.get("/dashboard/cashflow", { params: { userId } });
    return response.data.data;
  },
  simulate: async (input: SimulationInput): Promise<SimulationResult> => {
    const response = await api.post("/dashboard/simulate", input);
    return response.data.data;
  },
};

export const installmentService = {
  getAll: async (): Promise<Installment[]> => {
    const response = await api.get("/installments");
    return response.data.data;
  },
  getById: async (id: string): Promise<Installment> => {
    const response = await api.get(`/installments/${id}`);
    return response.data.data;
  },
};
