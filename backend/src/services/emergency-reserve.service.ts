import { TransactionRepository } from "../repositories/transaction.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { EmergencyReserve } from "../models/types";
import { roundMoney } from "../utils/helpers";

const TARGET_MONTHS = 6;

export class EmergencyReserveService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly accountRepo: BankAccountRepository
  ) {}

  async calculate(userId?: string): Promise<EmergencyReserve> {
    const now = new Date();

    // Média de despesas dos últimos 3 meses (mais realista que apenas o mês atual)
    const monthlyExpenses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const tx = await this.transactionRepo.findByPeriod(d.getMonth() + 1, d.getFullYear(), userId);
      monthlyExpenses.push(tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
    }
    const validExpenses = monthlyExpenses.filter((v) => v > 0);
    const avgMonthlyExpense = validExpenses.length
      ? validExpenses.reduce((a, b) => a + b, 0) / validExpenses.length
      : 0;

    const accounts = await this.accountRepo.findActive(userId);
    const currentReserve = roundMoney(accounts.reduce((s, a) => s + a.currentBalance, 0));

    const monthsProtected = avgMonthlyExpense > 0 ? roundMoney(currentReserve / avgMonthlyExpense) : 0;
    const targetAmount = roundMoney(avgMonthlyExpense * TARGET_MONTHS);
    const shortfall = roundMoney(Math.max(0, targetAmount - currentReserve));

    let healthStatus: EmergencyReserve["healthStatus"];
    if (monthsProtected >= TARGET_MONTHS) healthStatus = "excellent";
    else if (monthsProtected >= 3) healthStatus = "adequate";
    else if (monthsProtected >= 1) healthStatus = "insufficient";
    else healthStatus = "critical";

    return {
      monthlyExpenses: roundMoney(avgMonthlyExpense),
      currentReserve,
      monthsProtected,
      targetMonths: TARGET_MONTHS,
      targetAmount,
      isAdequate: monthsProtected >= TARGET_MONTHS,
      shortfall,
      healthStatus,
    };
  }
}
