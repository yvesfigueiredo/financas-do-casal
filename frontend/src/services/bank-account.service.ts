import api from "./api";
import { BankAccount, CreateBankAccountDTO, CreateTransferDTO, Transfer } from "../types";

export const bankAccountService = {
  getAll: async (userId?: string): Promise<BankAccount[]> => {
    const response = await api.get("/bank-accounts", { params: { userId } });
    return response.data.data;
  },
  getActive: async (userId?: string): Promise<BankAccount[]> => {
    const response = await api.get("/bank-accounts/active", { params: { userId } });
    return response.data.data;
  },
  getById: async (id: string): Promise<BankAccount> => {
    const response = await api.get(`/bank-accounts/${id}`);
    return response.data.data;
  },
  create: async (data: CreateBankAccountDTO): Promise<BankAccount> => {
    const response = await api.post("/bank-accounts", data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<BankAccount>): Promise<BankAccount> => {
    const response = await api.put(`/bank-accounts/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/bank-accounts/${id}`);
  },
  createTransfer: async (data: CreateTransferDTO): Promise<Transfer> => {
    const response = await api.post("/bank-accounts/transfer", data);
    return response.data.data;
  },
  getTransfers: async (accountId?: string): Promise<Transfer[]> => {
    const response = await api.get("/bank-accounts/transfers", { params: { accountId } });
    return response.data.data;
  },
};
