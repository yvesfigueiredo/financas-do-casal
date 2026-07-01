import api from "./api";
import { CreditCard, CreateCreditCardDTO, UpdateCreditCardDTO } from "../types";

export const creditCardService = {
  getAll: async (userId?: string): Promise<CreditCard[]> => {
    const response = await api.get("/credit-cards", { params: { userId } });
    return response.data.data;
  },
  getActive: async (userId?: string): Promise<CreditCard[]> => {
    const response = await api.get("/credit-cards/active", { params: { userId } });
    return response.data.data;
  },
  getById: async (id: string): Promise<CreditCard> => {
    const response = await api.get(`/credit-cards/${id}`);
    return response.data.data;
  },
  create: async (data: CreateCreditCardDTO): Promise<CreditCard> => {
    const response = await api.post("/credit-cards", data);
    return response.data.data;
  },
  update: async (id: string, data: UpdateCreditCardDTO): Promise<CreditCard> => {
    const response = await api.put(`/credit-cards/${id}`, data);
    return response.data.data;
  },
  toggleActive: async (id: string): Promise<CreditCard> => {
    const response = await api.patch(`/credit-cards/${id}/toggle`);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/credit-cards/${id}`);
  },
};
