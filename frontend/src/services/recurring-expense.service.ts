import api from "./api";
import { RecurringExpense, CreateRecurringExpenseDTO, UpdateRecurringExpenseDTO } from "../types";

export const recurringExpenseService = {
  getAll: async (userId?: string): Promise<RecurringExpense[]> => {
    const response = await api.get("/recurring-expenses", { params: { userId } });
    return response.data.data;
  },
  getById: async (id: string): Promise<RecurringExpense> => {
    const response = await api.get(`/recurring-expenses/${id}`);
    return response.data.data;
  },
  create: async (data: CreateRecurringExpenseDTO): Promise<RecurringExpense> => {
    const response = await api.post("/recurring-expenses", data);
    return response.data.data;
  },
  update: async (id: string, data: UpdateRecurringExpenseDTO): Promise<RecurringExpense> => {
    const response = await api.put(`/recurring-expenses/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/recurring-expenses/${id}`);
  },
  generateForMonth: async (month?: number, year?: number): Promise<{ generated: number }> => {
    const response = await api.post("/recurring-expenses/generate", { month, year });
    return response.data.data;
  },
};
