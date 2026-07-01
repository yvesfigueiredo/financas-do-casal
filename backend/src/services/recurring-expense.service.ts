import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  RecurringExpense,
  RecurringExpenseWithNext,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from "../models/types";
import { NotFoundError } from "../utils/errors";
import { getNextDueDate, shouldGenerateForMonth } from "../utils/helpers";

export class RecurringExpenseService {
  constructor(
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly userRepo: UserRepository
  ) {}

  async getAll(userId?: string): Promise<RecurringExpenseWithNext[]> {
    const expenses = await this.recurringRepo.findAll(userId);
    return expenses.map((e) => this.buildWithNext(e));
  }

  async getById(id: string): Promise<RecurringExpenseWithNext> {
    const expense = await this.recurringRepo.findById(id);
    if (!expense) throw new NotFoundError("Conta fixa");
    return this.buildWithNext(expense);
  }

  async create(data: CreateRecurringExpenseDTO): Promise<RecurringExpense> {
    const [user, category] = await Promise.all([
      this.userRepo.findById(data.userId),
      this.categoryRepo.findById(data.categoryId),
    ]);
    if (!user) throw new NotFoundError("Usuário");
    if (!category) throw new NotFoundError("Categoria");
    return this.recurringRepo.create(data);
  }

  async update(id: string, data: UpdateRecurringExpenseDTO): Promise<RecurringExpense> {
    const expense = await this.recurringRepo.findById(id);
    if (!expense) throw new NotFoundError("Conta fixa");
    return this.recurringRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const expense = await this.recurringRepo.findById(id);
    if (!expense) throw new NotFoundError("Conta fixa");
    await this.recurringRepo.delete(id);
  }

  // Gera os lançamentos para o mês/ano indicado (idempotente — nunca duplica)
  async generateForMonth(month: number, year: number): Promise<{ generated: number }> {
    const actives = await this.recurringRepo.findAll(undefined, true);
    let generated = 0;

    for (const expense of actives) {
      // Verifica se já foi gerado neste mês
      const alreadyDone = await this.recurringRepo.hasGeneratedForMonth(expense.id, month, year);
      if (alreadyDone) continue;

      // Verifica se deve gerar para este período
      const shouldGenerate = shouldGenerateForMonth(
        expense.periodicity as import("../models/types").Periodicity,
        expense.lastGenerated,
        month,
        year
      );
      if (!shouldGenerate) continue;

      // Cria o lançamento
      const dueDate = new Date(year, month - 1, expense.dueDay);
      await this.transactionRepo.createRecurringTransaction({
        description: expense.description,
        amount: expense.amount,
        type: "expense",
        date: dueDate,
        paymentMethod: expense.creditCardId ? "credit" : (expense.automaticDebit ? "debit" : "cash"),
        userId: expense.userId,
        categoryId: expense.categoryId,
        recurringExpenseId: expense.id,
        creditCardId: expense.creditCardId ?? undefined,
      });

      await this.recurringRepo.markGenerated(expense.id, dueDate);
      generated++;
    }

    return { generated };
  }

  private buildWithNext(expense: RecurringExpense): RecurringExpenseWithNext {
    const nextDueDate = getNextDueDate(
      expense.dueDay,
      expense.periodicity as import("../models/types").Periodicity,
      expense.lastGenerated
    );
    return {
      ...expense,
      nextDueDate,
      nextGenerationDate: nextDueDate,
    };
  }
}
