import api from "./api";
import { Category, User } from "../types";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data.data;
  },
};

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data.data;
  },

  getByType: async (type: "income" | "expense"): Promise<Category[]> => {
    const response = await api.get("/categories", { params: { type } });
    return response.data.data;
  },
};
