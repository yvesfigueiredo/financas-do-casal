import prisma from "../database/prisma";
import { Installment } from "../models/types";

// Include padrão para parcelamentos com transações
const installmentInclude = {
  transactions: {
    include: {
      user: true,
      category: true,
    },
    orderBy: {
      installmentNumber: "asc" as const,
    },
  },
} as const;

export class InstallmentRepository {
  // Cria um novo parcelamento
  async create(data: {
    description: string;
    totalAmount: number;
    installmentCount: number;
    installmentValue: number;
    startDate: Date;
  }): Promise<Installment> {
    return prisma.installment.create({ data }) as Promise<Installment>;
  }

  // Busca todos os parcelamentos com suas transações
  async findAll(): Promise<Installment[]> {
    return prisma.installment.findMany({
      include: installmentInclude,
      orderBy: { startDate: "desc" },
    }) as Promise<Installment[]>;
  }

  // Busca parcelamento por ID com transações
  async findById(id: string): Promise<Installment | null> {
    return prisma.installment.findUnique({
      where: { id },
      include: installmentInclude,
    }) as Promise<Installment | null>;
  }

  // Exclui um parcelamento e todas as suas transações (via cascade)
  async delete(id: string): Promise<void> {
    await prisma.installment.delete({ where: { id } });
  }
}
