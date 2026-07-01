import api from "./api";
import { Alert } from "../types";

export const alertService = {
  getAll: async (): Promise<{ alerts: Alert[]; unreadCount: number }> => {
    const response = await api.get("/alerts");
    return response.data.data;
  },
  markRead: async (ids: string[]): Promise<void> => {
    await api.post("/alerts/read", { ids });
  },
  dismiss: async (ids: string[]): Promise<void> => {
    await api.post("/alerts/dismiss", { ids });
  },
  runScan: async (): Promise<void> => {
    await api.post("/alerts/scan");
  },
};
