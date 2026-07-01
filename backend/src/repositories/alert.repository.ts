import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import { Alert, AlertType } from "../models/types";

export class AlertRepository {
  async create(data: {
    type: AlertType;
    title: string;
    message: string;
    dueDate?: Date;
    creditCardId?: string;
    recurringExpenseId?: string;
    installmentId?: string;
  }): Promise<Alert> {
    return prisma.alert.create({ data }) as Promise<Alert>;
  }

  async findAll(dismissed = false): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: { dismissed },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    }) as Promise<Alert[]>;
  }

  async countUnread(): Promise<number> {
    return prisma.alert.count({ where: { read: false, dismissed: false } });
  }

  async markRead(ids: string[]): Promise<void> {
    await prisma.alert.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  }

  async dismiss(ids: string[]): Promise<void> {
    await prisma.alert.updateMany({ where: { id: { in: ids } }, data: { dismissed: true, read: true } });
  }

  // Evita criar alertas duplicados do mesmo tipo para o mesmo recurso no mesmo dia
  async existsToday(type: AlertType, referenceId?: string): Promise<boolean> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const where: Prisma.AlertWhereInput = { type, createdAt: { gte: start } };
    if (referenceId) {
      where.OR = [
        { creditCardId: referenceId },
        { recurringExpenseId: referenceId },
        { installmentId: referenceId },
      ];
    }
    const count = await prisma.alert.count({ where });
    return count > 0;
  }

  async deleteOld(daysOld: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    await prisma.alert.deleteMany({ where: { dismissed: true, createdAt: { lte: cutoff } } });
  }
}
