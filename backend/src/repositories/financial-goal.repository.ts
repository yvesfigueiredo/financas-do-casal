import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import { FinancialGoal, CreateFinancialGoalDTO, UpdateFinancialGoalDTO } from "../models/types";

const include = { user: true } as const;

export class FinancialGoalRepository {
  async create(data: CreateFinancialGoalDTO): Promise<FinancialGoal> {
    return prisma.financialGoal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
        category: data.category,
        userId: data.userId,
      },
      include,
    }) as Promise<FinancialGoal>;
  }

  async findAll(userId?: string, activeOnly = false): Promise<FinancialGoal[]> {
    const where: Prisma.FinancialGoalWhereInput = {};
    if (userId) where.userId = userId;
    if (activeOnly) where.active = true;
    return prisma.financialGoal.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    }) as Promise<FinancialGoal[]>;
  }

  async findById(id: string): Promise<FinancialGoal | null> {
    return prisma.financialGoal.findUnique({ where: { id }, include }) as Promise<FinancialGoal | null>;
  }

  async update(id: string, data: UpdateFinancialGoalDTO): Promise<FinancialGoal> {
    return prisma.financialGoal.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
      },
      include,
    }) as Promise<FinancialGoal>;
  }

  async addContribution(id: string, amount: number): Promise<FinancialGoal> {
    return prisma.financialGoal.update({
      where: { id },
      data: { currentAmount: { increment: amount } },
      include,
    }) as Promise<FinancialGoal>;
  }

  async delete(id: string): Promise<void> {
    await prisma.financialGoal.delete({ where: { id } });
  }
}
