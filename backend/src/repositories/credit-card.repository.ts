import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import { CreditCard, CreateCreditCardDTO, UpdateCreditCardDTO } from "../models/types";

const include = { user: true } as const;

export class CreditCardRepository {
  async create(data: CreateCreditCardDTO): Promise<CreditCard> {
    return prisma.creditCard.create({ data, include }) as Promise<CreditCard>;
  }

  async findAll(userId?: string): Promise<CreditCard[]> {
    const where: Prisma.CreditCardWhereInput = {};
    if (userId) where.userId = userId;
    return prisma.creditCard.findMany({
      where,
      include,
      orderBy: { name: "asc" },
    }) as Promise<CreditCard[]>;
  }

  async findActive(userId?: string): Promise<CreditCard[]> {
    const where: Prisma.CreditCardWhereInput = { active: true };
    if (userId) where.userId = userId;
    return prisma.creditCard.findMany({
      where,
      include,
      orderBy: { name: "asc" },
    }) as Promise<CreditCard[]>;
  }

  async findById(id: string): Promise<CreditCard | null> {
    return prisma.creditCard.findUnique({ where: { id }, include }) as Promise<CreditCard | null>;
  }

  async update(id: string, data: UpdateCreditCardDTO): Promise<CreditCard> {
    return prisma.creditCard.update({ where: { id }, data, include }) as Promise<CreditCard>;
  }

  async delete(id: string): Promise<void> {
    await prisma.creditCard.delete({ where: { id } });
  }

  // Soma dos gastos de um cartão em um período (para calcular o limite utilizado)
  async getUsedAmount(cardId: string, start?: Date, end?: Date): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      creditCardId: cardId,
      type: "expense",
    };
    if (start || end) {
      where.date = {};
      if (start) (where.date as Prisma.DateTimeFilter).gte = start;
      if (end) (where.date as Prisma.DateTimeFilter).lte = end;
    }
    const result = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}
