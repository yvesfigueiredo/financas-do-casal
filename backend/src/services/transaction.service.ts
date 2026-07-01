import { TransactionRepository } from "../repositories/transaction.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { UserRepository } from "../repositories/user.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import {
  CreateInstallmentTransactionDTO,
  CreateTransactionDTO,
  PaginatedResult,
  TransactionFilters,
  TransactionWithRelations,
} from "../models/types";
import { NotFoundError, ValidationError } from "../utils/errors";
import { calculateInstallmentValue, getInstallmentDate } from "../utils/helpers";

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly installmentRepository: InstallmentRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly userRepository: UserRepository,
    private readonly bankAccountRepository?: BankAccountRepository
  ) {}

  async getMany(filters: TransactionFilters): Promise<PaginatedResult<TransactionWithRelations>> {
    return this.transactionRepository.findMany(filters);
  }

  async getById(id: string): Promise<TransactionWithRelations> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new NotFoundError("Lançamento");
    return transaction;
  }

  async createSimple(data: CreateTransactionDTO): Promise<TransactionWithRelations> {
    await this.validateUserAndCategory(data.userId, data.categoryId);
    const transaction = await this.transactionRepository.create(data);

    // Atualiza saldo da conta bancária se informada
    if (data.bankAccountId && this.bankAccountRepository) {
      const delta = data.type === "income" ? data.amount : -data.amount;
      await this.bankAccountRepository.updateBalance(data.bankAccountId, delta);
    }

    return transaction;
  }

  async createInstallment(
    data: CreateInstallmentTransactionDTO
  ): Promise<{ installmentId: string; transactionsCreated: number }> {
    await this.validateUserAndCategory(data.userId, data.categoryId);

    const installmentValue = calculateInstallmentValue(data.totalAmount, data.installmentCount);
    const installment = await this.installmentRepository.create({
      description: data.description,
      totalAmount: data.totalAmount,
      installmentCount: data.installmentCount,
      installmentValue,
      startDate: new Date(data.startDate),
    });

    const startDate = new Date(data.startDate);
    for (let i = 0; i < data.installmentCount; i++) {
      const parcelDate = getInstallmentDate(startDate, i);
      await this.transactionRepository.createInstallmentTransaction({
        description: `${data.description} - Parcela ${i + 1}/${data.installmentCount}`,
        amount: installmentValue,
        type: "expense",
        date: parcelDate,
        paymentMethod: data.paymentMethod ?? "credit",
        installmentNumber: i + 1,
        installmentTotal: data.installmentCount,
        userId: data.userId,
        categoryId: data.categoryId,
        installmentId: installment.id,
        creditCardId: data.creditCardId,
        bankAccountId: data.bankAccountId,
      });
    }

    return { installmentId: installment.id, transactionsCreated: data.installmentCount };
  }

  async deleteSimple(id: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new NotFoundError("Lançamento");
    if (transaction.installmentId) {
      throw new ValidationError(
        "Não é possível excluir parcela individualmente. Use a exclusão do parcelamento completo."
      );
    }

    // Reverte saldo da conta bancária se informada
    if (transaction.bankAccountId && this.bankAccountRepository) {
      const delta = transaction.type === "income" ? -transaction.amount : transaction.amount;
      await this.bankAccountRepository.updateBalance(transaction.bankAccountId, delta);
    }

    await this.transactionRepository.delete(id);
  }

  async deleteInstallment(installmentId: string): Promise<void> {
    const installment = await this.installmentRepository.findById(installmentId);
    if (!installment) throw new NotFoundError("Parcelamento");
    await this.installmentRepository.delete(installmentId);
  }

  private async validateUserAndCategory(userId: string, categoryId: string): Promise<void> {
    const [user, category] = await Promise.all([
      this.userRepository.findById(userId),
      this.categoryRepository.findById(categoryId),
    ]);
    if (!user) throw new NotFoundError("Usuário");
    if (!category) throw new NotFoundError("Categoria");
  }
}
