import api from "./api";
import {
  CreateInstallmentDTO,
  CreateTransactionDTO,
  PaginatedResult,
  TransactionFilters,
  TransactionWithRelations,
} from "../types";

export const transactionService = {
  getMany: async (
    filters: TransactionFilters
  ): Promise<PaginatedResult<TransactionWithRelations>> => {
    const response = await api.get("/transactions", { params: filters });
    return response.data.data;
  },

  getById: async (id: string): Promise<TransactionWithRelations> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.data;
  },

  createSimple: async (
    data: CreateTransactionDTO
  ): Promise<TransactionWithRelations> => {
    const response = await api.post("/transactions", data);
    return response.data.data;
  },

  createInstallment: async (
    data: CreateInstallmentDTO
  ): Promise<{ installmentId: string; transactionsCreated: number }> => {
    const response = await api.post("/transactions/installment", data);
    return response.data.data;
  },

  deleteSimple: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  deleteInstallment: async (installmentId: string): Promise<void> => {
    await api.delete(`/transactions/installment/${installmentId}`);
  },
};
