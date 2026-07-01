import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import {
  RecurringExpense,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from "../models/types";

const include = {
  user: true,
  category: true,
  creditCard: true,
} as const;

export class RecurringExpenseRepository {
  async create(data: CreateRecurringExpenseDTO): Promise<RecurringExpense> {
    return prisma.recurringExpense.create({
      data: {
        description: data.description,
        amount: data.amount,
        periodicity: data.periodicity,
        dueDay: data.dueDay,
        automaticDebit: data.automaticDebit,
        userId: data.userId,
        categoryId: data.categoryId,
        creditCardId: data.creditCardId ?? null,
      },
      include,
    }) as Promise<RecurringExpense>;
  }

  async findAll(userId?: string, activeOnly = false): Promise<RecurringExpense[]> {
    const where: Prisma.RecurringExpenseWhereInput = {};
    if (userId) where.userId = userId;
    if (activeOnly) where.active = true;
    return prisma.recurringExpense.findMany({
      where,
      include,
      orderBy: { dueDay: "asc" },
    }) as Promise<RecurringExpense[]>;
  }

  async findById(id: string): Promise<RecurringExpense | null> {
    return prisma.recurringExpense.findUnique({
      where: { id },
      include,
    }) as Promise<RecurringExpense | null>;
  }

  async update(id: string, data: UpdateRecurringExpenseDTO): Promise<RecurringExpense> {
    return prisma.recurringExpense.update({
      where: { id },
      data: {
        ...data,
        creditCardId: data.creditCardId === null ? null : data.creditCardId,
      },
      include,
    }) as Promise<RecurringExpense>;
  }

  async markGenerated(id: string, generatedAt: Date): Promise<void> {
    await prisma.recurringExpense.update({
      where: { id },
      data: { lastGenerated: generatedAt },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.recurringExpense.delete({ where: { id } });
  }

  // Verifica se já existe lançamento gerado por esta recorrência no mês/ano
  async hasGeneratedForMonth(recurringId: string, month: number, year: number): Promise<boolean> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const count = await prisma.transaction.count({
      where: {
        recurringExpenseId: recurringId,
        date: { gte: start, lte: end },
      },
    });
    return count > 0;
  }
}
