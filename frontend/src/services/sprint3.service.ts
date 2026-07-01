import api from "./api";
import {
  HealthScore, FinancialInsight, FinancialGoal, CreateFinancialGoalDTO, UpdateFinancialGoalDTO,
  FinancialProjection, EmergencyReserve, TimelineEvent, SimulationScenario, SaveScenarioDTO,
  BankImport, ExecutiveDashboard,
} from "../types";

export const healthScoreService = {
  get: async (userId?: string): Promise<HealthScore> => {
    const response = await api.get("/health-score", { params: { userId } });
    return response.data.data;
  },
};

export const assistantService = {
  getInsights: async (userId?: string): Promise<FinancialInsight[]> => {
    const response = await api.get("/assistant/insights", { params: { userId } });
    return response.data.data;
  },
};

export const goalService = {
  getAll: async (userId?: string): Promise<FinancialGoal[]> => {
    const response = await api.get("/goals", { params: { userId } });
    return response.data.data;
  },
  getById: async (id: string): Promise<FinancialGoal> => {
    const response = await api.get(`/goals/${id}`);
    return response.data.data;
  },
  create: async (data: CreateFinancialGoalDTO): Promise<FinancialGoal> => {
    const response = await api.post("/goals", data);
    return response.data.data;
  },
  update: async (id: string, data: UpdateFinancialGoalDTO): Promise<FinancialGoal> => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data.data;
  },
  addContribution: async (id: string, amount: number): Promise<FinancialGoal> => {
    const response = await api.post(`/goals/${id}/contribute`, { amount });
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },
};

export const projectionService = {
  get: async (months: 6 | 12 | 24 | 36, userId?: string): Promise<FinancialProjection> => {
    const response = await api.get("/projection", { params: { months, userId } });
    return response.data.data;
  },
};

export const emergencyReserveService = {
  get: async (userId?: string): Promise<EmergencyReserve> => {
    const response = await api.get("/emergency-reserve", { params: { userId } });
    return response.data.data;
  },
};

export const timelineService = {
  get: async (days?: number, userId?: string): Promise<TimelineEvent[]> => {
    const response = await api.get("/timeline", { params: { days, userId } });
    return response.data.data;
  },
};

export const scenarioService = {
  getAll: async (userId?: string): Promise<SimulationScenario[]> => {
    const response = await api.get("/scenarios", { params: { userId } });
    return response.data.data;
  },
  getById: async (id: string): Promise<SimulationScenario> => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data.data;
  },
  save: async (data: SaveScenarioDTO): Promise<SimulationScenario> => {
    const response = await api.post("/scenarios", data);
    return response.data.data;
  },
  compare: async (ids: string[]): Promise<{ scenario: SimulationScenario; result: import("../types").SimulationResult }[]> => {
    const response = await api.get("/scenarios/compare", { params: { ids: ids.join(",") } });
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/scenarios/${id}`);
  },
};

export const bankImportService = {
  import: async (data: { bankAccountId: string; format: "ofx" | "csv"; content: string; filename: string; userId: string }): Promise<BankImport> => {
    const response = await api.post("/bank-imports", data);
    return response.data.data;
  },
  getAll: async (bankAccountId?: string): Promise<BankImport[]> => {
    const response = await api.get("/bank-imports", { params: { bankAccountId } });
    return response.data.data;
  },
};

export const executiveDashboardService = {
  get: async (userId?: string): Promise<ExecutiveDashboard> => {
    const response = await api.get("/executive-dashboard", { params: { userId } });
    return response.data.data;
  },
};
