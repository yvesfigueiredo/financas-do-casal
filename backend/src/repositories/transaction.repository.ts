import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import {
  CreateTransactionDTO,
  PaginatedResult,
  Transaction,
  TransactionFilters,
  TransactionWithRelations,
} from "../models/types";

const transactionInclude = {
  user: true,
  category: true,
  installment: true,
  creditCard: true,
  bankAccount: true,
  recurringExpense: true,
} as const;

export class TransactionRepository {
  async create(data: CreateTransactionDTO): Promise<TransactionWithRelations> {
    return prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod ?? "cash",
        userId: data.userId,
        categoryId: data.categoryId,
        creditCardId: data.creditCardId ?? null,
        bankAccountId: data.bankAccountId ?? null,
      },
      include: transactionInclude,
    }) as Promise<TransactionWithRelations>;
  }

  async createInstallmentTransaction(data: {
    description: string;
    amount: number;
    type: "expense";
    date: Date;
    paymentMethod: string;
    installmentNumber: number;
    installmentTotal: number;
    userId: string;
    categoryId: string;
    installmentId: string;
    creditCardId?: string;
    bankAccountId?: string;
  }): Promise<Transaction> {
    return prisma.transaction.create({ data }) as Promise<Transaction>;
  }

  async createRecurringTransaction(data: {
    description: string;
    amount: number;
    type: "expense";
    date: Date;
    paymentMethod: string;
    userId: string;
    categoryId: string;
    recurringExpenseId: string;
    creditCardId?: string;
    bankAccountId?: string;
  }): Promise<Transaction> {
    return prisma.transaction.create({ data }) as Promise<Transaction>;
  }

  async findMany(filters: TransactionFilters): Promise<PaginatedResult<TransactionWithRelations>> {
    const { userId, month, year, type, categoryId, creditCardId, bankAccountId, page = 1, limit = 20 } = filters;
    const where: Prisma.TransactionWhereInput = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (creditCardId) where.creditCardId = creditCardId;
    if (bankAccountId) where.bankAccountId = bankAccountId;

    if (month !== undefined && year !== undefined) {
      where.date = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) };
    } else if (year !== undefined) {
      where.date = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) };
    } else if (month !== undefined) {
      const y = new Date().getFullYear();
      where.date = { gte: new Date(y, month - 1, 1), lte: new Date(y, month, 0, 23, 59, 59) };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: transactionInclude,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data: data as TransactionWithRelations[], total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByPeriod(month: number, year: number, userId?: string): Promise<TransactionWithRelations[]> {
    const where: Prisma.TransactionWhereInput = {
      date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) },
    };
    if (userId) where.userId = userId;
    return prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { date: "desc" },
    }) as Promise<TransactionWithRelations[]>;
  }

  async findByYear(year: number, userId?: string): Promise<TransactionWithRelations[]> {
    const where: Prisma.TransactionWhereInput = {
      date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) },
    };
    if (userId) where.userId = userId;
    return prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { date: "asc" },
    }) as Promise<TransactionWithRelations[]>;
  }

  async findById(id: string): Promise<TransactionWithRelations | null> {
    return prisma.transaction.findUnique({
      where: { id },
      include: transactionInclude,
    }) as Promise<TransactionWithRelations | null>;
  }

  async findFutureInstallments(fromDate: Date, months: number): Promise<TransactionWithRelations[]> {
    const toDate = new Date(fromDate);
    toDate.setMonth(toDate.getMonth() + months);
    toDate.setDate(0);
    return prisma.transaction.findMany({
      where: {
        type: "expense",
        installmentId: { not: null },
        date: { gte: fromDate, lte: toDate },
      },
      include: transactionInclude,
      orderBy: { date: "asc" },
    }) as Promise<TransactionWithRelations[]>;
  }

  async findFutureInstallmentsRange(fromDate: Date, toDate: Date): Promise<TransactionWithRelations[]> {
    return prisma.transaction.findMany({
      where: {
        type: "expense",
        installmentId: { not: null },
        date: { gte: fromDate, lte: toDate },
      },
      include: transactionInclude,
      orderBy: { date: "asc" },
    }) as Promise<TransactionWithRelations[]>;
  }

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } });
  }

  async deleteByInstallmentId(installmentId: string): Promise<void> {
    await prisma.transaction.deleteMany({ where: { installmentId } });
  }

  // Totais por cartão para o período atual de fatura
  async getCardTotalForPeriod(cardId: string, start: Date, end: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: { creditCardId: cardId, type: "expense", date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}
