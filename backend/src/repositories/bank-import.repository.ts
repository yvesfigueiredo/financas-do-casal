import prisma from "../database/prisma";
import { BankImport, ImportStatus } from "../models/types";

export class BankImportRepository {
  async create(data: {
    filename: string;
    format: "ofx" | "csv";
    bankAccountId: string;
    totalRows: number;
  }): Promise<BankImport> {
    return prisma.bankImport.create({ data }) as Promise<BankImport>;
  }

  async update(id: string, data: {
    status?: ImportStatus;
    importedRows?: number;
    duplicateRows?: number;
    errorMessage?: string;
  }): Promise<BankImport> {
    return prisma.bankImport.update({ where: { id }, data }) as Promise<BankImport>;
  }

  async findAll(bankAccountId?: string): Promise<BankImport[]> {
    return prisma.bankImport.findMany({
      where: bankAccountId ? { bankAccountId } : undefined,
      orderBy: { createdAt: "desc" },
    }) as Promise<BankImport[]>;
  }

  async findById(id: string): Promise<BankImport | null> {
    return prisma.bankImport.findUnique({ where: { id } }) as Promise<BankImport | null>;
  }

  // Verifica se já existe uma transação com mesma data/valor/descrição (heurística de duplicata)
  async findPossibleDuplicate(bankAccountId: string, date: Date, amount: number, description: string): Promise<boolean> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    const count = await prisma.transaction.count({
      where: {
        bankAccountId,
        amount,
        date: { gte: startOfDay, lte: endOfDay },
        description: { contains: description.substring(0, 20) },
      },
    });
    return count > 0;
  }
}
