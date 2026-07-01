import { TransactionRepository } from "../repositories/transaction.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { FinancialProjection, ProjectionMonth } from "../models/types";
import { getMonthName, roundMoney } from "../utils/helpers";

export class ProjectionService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly accountRepo: BankAccountRepository,
    private readonly goalRepo: FinancialGoalRepository
  ) {}

  async project(months: number, userId?: string): Promise<FinancialProjection> {
    const now = new Date();

    // Saldo atual consolidado das contas
    const accounts = await this.accountRepo.findActive(userId);
    let runningBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

    // Médias históricas (últimos 3 meses) para projetar receita/despesa recorrente sem fixas/parcelas
    const historicalIncomes: number[] = [];
    const historicalExpenses: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const tx = await this.transactionRepo.findByPeriod(d.getMonth() + 1, d.getFullYear(), userId);
      historicalIncomes.push(tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
      historicalExpenses.push(
        tx.filter((t) => t.type === "expense" && !t.installmentId && !t.recurringExpenseId).reduce((s, t) => s + t.amount, 0)
      );
    }
    const avgIncome = historicalIncomes.length
      ? historicalIncomes.reduce((a, b) => a + b, 0) / historicalIncomes.length
      : 0;
    const avgExpense = historicalExpenses.length
      ? historicalExpenses.reduce((a, b) => a + b, 0) / historicalExpenses.length
      : 0;

    const recurringExpenses = await this.recurringRepo.findAll(userId, true);
    const monthlyRecurring = recurringExpenses
      .filter((r) => r.periodicity === "monthly")
      .reduce((s, r) => s + r.amount, 0);

    const activeGoals = await this.goalRepo.findAll(userId, true);
    const monthlyGoalContribution = 0; // contribuições são manuais; projeção não assume valor fixo

    const monthsArr: ProjectionMonth[] = [];
    let totalInstallmentCommitment = 0;
    let totalRecurringCommitment = 0;

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();
      const startDate = new Date(tYear, tMonth - 1, 1);
      const endDate = new Date(tYear, tMonth, 0, 23, 59, 59);

      const futureInstallments = await this.transactionRepo.findFutureInstallmentsRange(startDate, endDate);
      const installmentsTotal = roundMoney(futureInstallments.reduce((s, t) => s + t.amount, 0));

      const projectedIncome = roundMoney(avgIncome);
      const projectedExpense = roundMoney(avgExpense);
      const projectedRecurring = roundMoney(monthlyRecurring);

      const monthBalance = roundMoney(
        projectedIncome - projectedExpense - installmentsTotal - projectedRecurring - monthlyGoalContribution
      );
      runningBalance = roundMoney(runningBalance + monthBalance);

      totalInstallmentCommitment += installmentsTotal;
      totalRecurringCommitment += projectedRecurring;

      monthsArr.push({
        month: tMonth,
        year: tYear,
        monthLabel: `${getMonthName(tMonth)} ${tYear}`,
        projectedIncome,
        projectedExpense,
        projectedInstallments: installmentsTotal,
        projectedRecurring,
        projectedBalance: monthBalance,
        runningBalance,
        goalContributions: monthlyGoalContribution,
      });
    }

    const at = (m: number) => monthsArr[Math.min(m, monthsArr.length) - 1]?.runningBalance ?? runningBalance;

    return {
      months: monthsArr,
      summary: {
        projectedBalanceAt6m: at(Math.min(6, months)),
        projectedBalanceAt12m: at(Math.min(12, months)),
        projectedBalanceAt24m: at(Math.min(24, months)),
        projectedBalanceAt36m: at(Math.min(36, months)),
        averageMonthlyIncome: roundMoney(avgIncome),
        averageMonthlyExpense: roundMoney(avgExpense),
        averageMonthlySavings: roundMoney(avgIncome - avgExpense),
        totalInstallmentCommitment: roundMoney(totalInstallmentCommitment),
        totalRecurringCommitment: roundMoney(totalRecurringCommitment),
      },
    };
  }
}
