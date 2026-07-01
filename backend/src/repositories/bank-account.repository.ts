import { Prisma } from "@prisma/client";
import prisma from "../database/prisma";
import {
  BankAccount,
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
  Transfer,
  CreateTransferDTO,
} from "../models/types";

const accountInclude = { user: true } as const;
const transferInclude = { fromAccount: true, toAccount: true } as const;

export class BankAccountRepository {
  async create(data: CreateBankAccountDTO): Promise<BankAccount> {
    return prisma.bankAccount.create({
      data: {
        name: data.name,
        type: data.type,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance,
        color: data.color,
        userId: data.userId,
      },
      include: accountInclude,
    }) as Promise<BankAccount>;
  }

  async findAll(userId?: string): Promise<BankAccount[]> {
    const where: Prisma.BankAccountWhereInput = {};
    if (userId) where.userId = userId;
    return prisma.bankAccount.findMany({
      where,
      include: accountInclude,
      orderBy: { name: "asc" },
    }) as Promise<BankAccount[]>;
  }

  async findActive(userId?: string): Promise<BankAccount[]> {
    const where: Prisma.BankAccountWhereInput = { active: true };
    if (userId) where.userId = userId;
    return prisma.bankAccount.findMany({
      where,
      include: accountInclude,
      orderBy: { name: "asc" },
    }) as Promise<BankAccount[]>;
  }

  async findById(id: string): Promise<BankAccount | null> {
    return prisma.bankAccount.findUnique({
      where: { id },
      include: accountInclude,
    }) as Promise<BankAccount | null>;
  }

  async update(id: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    return prisma.bankAccount.update({
      where: { id },
      data,
      include: accountInclude,
    }) as Promise<BankAccount>;
  }

  async updateBalance(id: string, delta: number): Promise<void> {
    await prisma.bankAccount.update({
      where: { id },
      data: { currentBalance: { increment: delta } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.bankAccount.delete({ where: { id } });
  }

  // Transferências
  async createTransfer(data: CreateTransferDTO): Promise<Transfer> {
    return prisma.transfer.create({
      data: {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
      },
      include: transferInclude,
    }) as Promise<Transfer>;
  }

  async findTransfers(accountId?: string): Promise<Transfer[]> {
    const where: Prisma.TransferWhereInput = {};
    if (accountId) {
      where.OR = [{ fromAccountId: accountId }, { toAccountId: accountId }];
    }
    return prisma.transfer.findMany({
      where,
      include: transferInclude,
      orderBy: { date: "desc" },
    }) as Promise<Transfer[]>;
  }

  async getTotalIn(accountId: string): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: { bankAccountId: accountId, type: "income" },
      _sum: { amount: true },
    });
    const transferIn = await prisma.transfer.aggregate({
      where: { toAccountId: accountId },
      _sum: { amount: true },
    });
    return (result._sum.amount ?? 0) + (transferIn._sum.amount ?? 0);
  }

  async getTotalOut(accountId: string): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: { bankAccountId: accountId, type: "expense" },
      _sum: { amount: true },
    });
    const transferOut = await prisma.transfer.aggregate({
      where: { fromAccountId: accountId },
      _sum: { amount: true },
    });
    return (result._sum.amount ?? 0) + (transferOut._sum.amount ?? 0);
  }
}
