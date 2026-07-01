import { HealthScoreService } from "./health-score.service";
import { EmergencyReserveService } from "./emergency-reserve.service";
import { FinancialAssistantService } from "./financial-assistant.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { AlertRepository } from "../repositories/alert.repository";
import { ExecutiveDashboard } from "../models/types";
import { getCardBillingPeriod, roundMoney } from "../utils/helpers";

export class ExecutiveDashboardService {
  constructor(
    private readonly healthScoreService: HealthScoreService,
    private readonly emergencyReserveService: EmergencyReserveService,
    private readonly assistantService: FinancialAssistantService,
    private readonly transactionRepo: TransactionRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly accountRepo: BankAccountRepository,
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly goalRepo: FinancialGoalRepository,
    private readonly alertRepo: AlertRepository
  ) {}

  async get(userId?: string): Promise<ExecutiveDashboard> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [healthScore, emergencyReserve, insights, accounts, alertsUnread] = await Promise.all([
      this.healthScoreService.calculate(userId),
      this.emergencyReserveService.calculate(userId),
      this.assistantService.generateInsights(userId),
      this.accountRepo.findActive(userId),
      this.alertRepo.countUnread(),
    ]);

    const currentBalance = roundMoney(accounts.reduce((s, a) => s + a.currentBalance, 0));

    // Médias dos últimos 3 meses
    const incomes: number[] = [];
    const expenses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month - 1 - i, 1);
      const tx = await this.transactionRepo.findByPeriod(d.getMonth() + 1, d.getFullYear(), userId);
      incomes.push(tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
      expenses.push(tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
    }
    const avgIncome = roundMoney(incomes.reduce((a, b) => a + b, 0) / incomes.length);
    const avgExpense = roundMoney(expenses.reduce((a, b) => a + b, 0) / expenses.length);

    // Comprometimento
    const futureInstallments = await this.transactionRepo.findFutureInstallments(now, 1);
    const committedInstallments = roundMoney(futureInstallments.reduce((s, t) => s + t.amount, 0));
    const recurringExpenses = await this.recurringRepo.findAll(userId, true);
    const committedRecurring = roundMoney(
      recurringExpenses.filter((r) => r.periodicity === "monthly").reduce((s, r) => s + r.amount, 0)
    );
    const forecastBalance = roundMoney(currentBalance - committedInstallments - committedRecurring);

    // Top entidades
    const currentTx = await this.transactionRepo.findByPeriod(month, year, userId);
    const expensesByCategory = new Map<string, number>();
    for (const t of currentTx.filter((t) => t.type === "expense")) {
      expensesByCategory.set(t.category.name, (expensesByCategory.get(t.category.name) ?? 0) + t.amount);
    }
    const topCategoryEntry = [...expensesByCategory.entries()].sort((a, b) => b[1] - a[1])[0];

    const cards = await this.cardRepo.findActive(userId);
    let topCard: { name: string; amount: number } | null = null;
    let maxCardUsage = 0;
    for (const card of cards) {
      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      if (used > maxCardUsage) {
        maxCardUsage = used;
        topCard = { name: card.name, amount: roundMoney(used) };
      }
    }

    const topAccount = accounts.length
      ? accounts.reduce((max, a) => (a.currentBalance > max.currentBalance ? a : max))
      : null;

    const topRecurring = recurringExpenses.length
      ? recurringExpenses.reduce((max, r) => (r.amount > max.amount ? r : max))
      : null;

    // Objetivos
    const goals = await this.goalRepo.findAll(userId, true);
    let onTrack = 0;
    let atRisk = 0;
    let totalTarget = 0;
    let totalCurrent = 0;
    for (const g of goals) {
      totalTarget += g.targetAmount;
      totalCurrent += g.currentAmount;
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      if (g.deadline) {
        const monthsLeft = (new Date(g.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (progress < 50 && monthsLeft < 6 && monthsLeft > 0) atRisk++;
        else onTrack++;
      } else {
        onTrack++;
      }
    }

    return {
      healthScore,
      emergencyReserve,
      balance: { current: currentBalance, forecast: forecastBalance },
      averages: { income: avgIncome, expense: avgExpense, savings: roundMoney(avgIncome - avgExpense) },
      topEntities: {
        category: topCategoryEntry ? { name: topCategoryEntry[0], amount: roundMoney(topCategoryEntry[1]) } : null,
        card: topCard,
        bankAccount: topAccount ? { name: topAccount.name, balance: roundMoney(topAccount.currentBalance) } : null,
        recurringExpense: topRecurring ? { description: topRecurring.description, amount: topRecurring.amount } : null,
      },
      goalsSummary: {
        total: goals.length,
        onTrack,
        atRisk,
        totalTargetAmount: roundMoney(totalTarget),
        totalCurrentAmount: roundMoney(totalCurrent),
      },
      insightsCount: {
        critical: insights.filter((i) => i.severity === "critical").length,
        warning: insights.filter((i) => i.severity === "warning").length,
        positive: insights.filter((i) => i.severity === "positive").length,
      },
      alertsCount: alertsUnread,
    };
  }
}
