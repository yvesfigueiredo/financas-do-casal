import { InstallmentRepository } from "../repositories/installment.repository";
import {
  Installment,
  InstallmentWithProgress,
  TransactionWithRelations,
} from "../models/types";
import { NotFoundError } from "../utils/errors";
import { isPastDate } from "../utils/helpers";

export class InstallmentService {
  constructor(
    private readonly installmentRepository: InstallmentRepository
  ) {}

  // Retorna todos os parcelamentos com progresso calculado
  async getAll(): Promise<InstallmentWithProgress[]> {
    const installments = await this.installmentRepository.findAll();
    return installments.map((inst) => this.buildProgress(inst));
  }

  // Retorna um parcelamento por ID com progresso
  async getById(id: string): Promise<InstallmentWithProgress> {
    const installment = await this.installmentRepository.findById(id);
    if (!installment) {
      throw new NotFoundError("Parcelamento");
    }
    return this.buildProgress(installment);
  }

  // Calcula o progresso de um parcelamento baseado na data atual
  // Parcelas com data anterior ou igual à hoje são consideradas pagas
  private buildProgress(
    installment: Installment
  ): InstallmentWithProgress {
    const transactions = (installment.transactions ?? []) as TransactionWithRelations[];

    const paidTransactions = transactions.filter((t) => isPastDate(t.date));
    const pendingTransactions = transactions.filter((t) => !isPastDate(t.date));

    const paidCount = paidTransactions.length;
    const pendingCount = pendingTransactions.length;
    const paidAmount = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pendingTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Pega o usuário e categoria da primeira parcela (todas são do mesmo usuário/categoria)
    const firstTransaction = transactions[0];
    const userName = firstTransaction?.user?.name ?? "Desconhecido";
    const categoryName = firstTransaction?.category?.name ?? "Desconhecida";

    return {
      ...installment,
      paidCount,
      pendingCount,
      paidAmount,
      pendingAmount,
      userName,
      categoryName,
    };
  }
}
