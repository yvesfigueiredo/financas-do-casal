import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import {
  AnnualSummary,
  CardSummary,
  CategorySummary,
  DashboardSummary,
  FutureCommitmentMonth,
  MonthSummary,
  NextInvoiceSummary,
  TransactionWithRelations,
  UserSummary,
  AccumulatedMonth,
  CashFlowMonth,
} from "../models/types";
import {
  getCardBillingPeriod,
  getFirstDayOfCurrentMonth,
  getMonthName,
  roundMoney,
} from "../utils/helpers";

export class DashboardService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly recurringRepo: RecurringExpenseRepository
  ) {}

  async getSummary(month: number, year: number, userId?: string): Promise<DashboardSummary> {
    const transactions = await this.transactionRepo.findByPeriod(month, year, userId);
    const allCards = await this.cardRepo.findActive(userId);

    const totalIncome = roundMoney(this.sumByType(transactions, "income"));
    const totalExpense = roundMoney(this.sumByType(transactions, "expense"));
    const balance = roundMoney(totalIncome - totalExpense);

    // Crédito
    let totalCreditLimit = 0;
    let totalCreditUsed = 0;
    const cardStatsPromises = allCards.map(async (card) => {
      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      return { card, used };
    });
    const cardStats = await Promise.all(cardStatsPromises);
    for (const { card, used } of cardStats) {
      totalCreditLimit += card.limit;
      totalCreditUsed += used;
    }

    // Próximas faturas
    const nextInvoices: NextInvoiceSummary[] = cardStats.map(({ card, used }) => ({
      cardId: card.id,
      cardName: card.name,
      brand: card.brand,
      color: card.color,
      dueDay: card.dueDay,
      amount: roundMoney(used),
    }));

    // Gráfico por categoria e por cartão
    const byCategory = this.buildCategorySummary(transactions);
    const byUser = this.buildUserSummary(transactions);
    const byCard = this.buildCardSummary(transactions);

    // Comprometimento futuro
    const fromDate = getFirstDayOfCurrentMonth();
    const futureInstallments = await this.transactionRepo.findFutureInstallments(fromDate, 3);
    const upcomingInstallments = this.buildUpcomingInstallments(futureInstallments);

    // Previsão de saldo até o fim do mês
    const now = new Date();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const futureThisMonth = await this.transactionRepo.findFutureInstallments(now, 1);
    const committedInstallments = roundMoney(futureThisMonth.reduce((s, t) => s + t.amount, 0));

    const recurringExpenses = await this.recurringRepo.findAll(userId, true);
    const committedRecurring = roundMoney(
      recurringExpenses.filter((r) => r.periodicity === "monthly").reduce((s, r) => s + r.amount, 0)
    );

    const balanceForecast = roundMoney(balance - committedInstallments - committedRecurring);

    // Top categoria e cartão
    const topCategory = byCategory[0]?.categoryName ?? null;
    const topCard = byCard[0]?.cardName ?? null;

    // Próxima conta fixa
    const sortedRecurring = recurringExpenses
      .filter((r) => r.dueDay >= now.getDate())
      .sort((a, b) => a.dueDay - b.dueDay);
    const nextBill = sortedRecurring[0]
      ? {
          description: sortedRecurring[0].description,
          amount: sortedRecurring[0].amount,
          dueDate: new Date(year, month - 1, sortedRecurring[0].dueDay),
        }
      : null;

    // Próxima fatura
    const sortedInvoices = nextInvoices.filter((i) => i.amount > 0).sort((a, b) => a.dueDay - b.dueDay);
    const nextInvoice = sortedInvoices[0]
      ? {
          cardName: sortedInvoices[0].cardName,
          amount: sortedInvoices[0].amount,
          dueDate: new Date(year, month - 1, sortedInvoices[0].dueDay),
        }
      : null;

    return {
      totalIncome,
      totalExpense,
      balance,
      totalCreditLimit: roundMoney(totalCreditLimit),
      totalCreditUsed: roundMoney(totalCreditUsed),
      totalCreditAvailable: roundMoney(Math.max(0, totalCreditLimit - totalCreditUsed)),
      byCategory,
      byUser,
      byCard,
      upcomingInstallments,
      nextInvoices,
      topCategory,
      topCard,
      balanceForecast,
      committedInstallments,
      committedRecurring,
      nextBill,
      nextInvoice,
    };
  }

  async getAnnualSummary(year: number, userId?: string): Promise<AnnualSummary> {
    const transactions = await this.transactionRepo.findByYear(year, userId);
    const recurringExpenses = await this.recurringRepo.findAll(userId, true);

    const months: MonthSummary[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthTx = transactions.filter((t) => new Date(t.date).getMonth() + 1 === m);
      const income = roundMoney(this.sumByType(monthTx, "income"));
      const expense = roundMoney(this.sumByType(monthTx, "expense"));
      months.push({ month: m, monthLabel: getMonthName(m), totalIncome: income, totalExpense: expense, balance: roundMoney(income - expense) });
    }

    // Saldo acumulado mês a mês
    let accumulated = 0;
    const accumulatedBalance: AccumulatedMonth[] = months.map((m) => {
      accumulated = roundMoney(accumulated + m.balance);
      return { month: m.month, monthLabel: m.monthLabel, balance: accumulated };
    });

    // Comprometimento futuro (12 meses)
    const now = new Date();
    const futureCommitment: FutureCommitmentMonth[] = [];
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();

      const startDate = new Date(tYear, tMonth - 1, 1);
      const endDate = new Date(tYear, tMonth, 0, 23, 59, 59);
      const installments = await this.transactionRepo.findFutureInstallmentsRange(startDate, endDate);
      const installTotal = roundMoney(installments.reduce((s, t) => s + t.amount, 0));

      const recurring = roundMoney(
        recurringExpenses.filter((r) => r.periodicity === "monthly").reduce((s, r) => s + r.amount, 0)
      );

      futureCommitment.push({
        month: tMonth,
        year: tYear,
        monthLabel: `${getMonthName(tMonth)} ${tYear}`,
        installments: installTotal,
        recurring,
        total: roundMoney(installTotal + recurring),
      });
    }

    return { year, months, accumulatedBalance, futureCommitment };
  }

  async getCashFlow(userId?: string): Promise<CashFlowMonth[]> {
    const now = new Date();
    const recurringExpenses = await this.recurringRepo.findAll(userId, true);
    const result: CashFlowMonth[] = [];

    // Busca saldo atual das contas (soma de todas as contas do usuário)
    // Para simplificação, projeta a partir do mês atual com base nos lançamentos existentes
    let runningBalance = 0;

    // Busca saldo do mês passado como base
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTx = await this.transactionRepo.findByPeriod(
      lastMonth.getMonth() + 1,
      lastMonth.getFullYear(),
      userId
    );
    runningBalance = roundMoney(
      this.sumByType(lastMonthTx, "income") - this.sumByType(lastMonthTx, "expense")
    );

    for (let i = 0; i < 24; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();
      const startDate = new Date(tYear, tMonth - 1, 1);
      const endDate = new Date(tYear, tMonth, 0, 23, 59, 59);

      const transactions = await this.transactionRepo.findByPeriod(tMonth, tYear, userId);
      const income = roundMoney(this.sumByType(transactions, "income"));
      const expenses = roundMoney(this.sumByType(transactions.filter((t) => !t.installmentId && !t.recurringExpenseId), "expense"));

      const futureInstall = await this.transactionRepo.findFutureInstallmentsRange(startDate, endDate);
      const installments = roundMoney(futureInstall.reduce((s, t) => s + t.amount, 0));

      const recurring = roundMoney(
        recurringExpenses.filter((r) => r.periodicity === "monthly").reduce((s, r) => s + r.amount, 0)
      );

      const openingBalance = runningBalance;
      const closingBalance = roundMoney(openingBalance + income - expenses - installments - recurring);
      runningBalance = closingBalance;

      result.push({
        month: tMonth,
        year: tYear,
        monthLabel: `${getMonthName(tMonth)} ${tYear}`,
        openingBalance,
        income,
        expenses,
        installments,
        recurring,
        transfers: 0,
        closingBalance,
      });
    }

    return result;
  }

  private sumByType(transactions: TransactionWithRelations[], type: "income" | "expense"): number {
    return transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  }

  private buildCategorySummary(transactions: TransactionWithRelations[]): CategorySummary[] {
    const expenses = transactions.filter((t) => t.type === "expense");
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, { name: string; total: number }>();
    for (const t of expenses) {
      const ex = map.get(t.categoryId);
      if (ex) ex.total += t.amount;
      else map.set(t.categoryId, { name: t.category.name, total: t.amount });
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({
        categoryId: id,
        categoryName: v.name,
        total: roundMoney(v.total),
        percentage: total > 0 ? roundMoney((v.total / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private buildUserSummary(transactions: TransactionWithRelations[]): UserSummary[] {
    const map = new Map<string, { name: string; income: number; expense: number }>();
    for (const t of transactions) {
      const ex = map.get(t.userId);
      if (ex) {
        if (t.type === "income") ex.income += t.amount;
        else ex.expense += t.amount;
      } else {
        map.set(t.userId, {
          name: t.user.name,
          income: t.type === "income" ? t.amount : 0,
          expense: t.type === "expense" ? t.amount : 0,
        });
      }
    }
    return Array.from(map.entries()).map(([userId, d]) => ({
      userId,
      userName: d.name,
      totalIncome: roundMoney(d.income),
      totalExpense: roundMoney(d.expense),
      balance: roundMoney(d.income - d.expense),
    }));
  }

  private buildCardSummary(transactions: TransactionWithRelations[]): CardSummary[] {
    const cardExpenses = transactions.filter((t) => t.type === "expense" && t.creditCardId);
    const total = cardExpenses.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, { name: string; brand: string; color: string; total: number }>();
    for (const t of cardExpenses) {
      if (!t.creditCardId || !t.creditCard) continue;
      const ex = map.get(t.creditCardId);
      if (ex) ex.total += t.amount;
      else map.set(t.creditCardId, { name: t.creditCard.name, brand: t.creditCard.brand, color: t.creditCard.color, total: t.amount });
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({
        cardId: id,
        cardName: v.name,
        brand: v.brand,
        color: v.color,
        total: roundMoney(v.total),
        percentage: total > 0 ? roundMoney((v.total / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private buildUpcomingInstallments(transactions: TransactionWithRelations[]) {
    const byMonth = new Map<string, { month: number; year: number; items: { description: string; amount: number; installmentNumber: number; installmentTotal: number }[] }>();
    for (const t of transactions) {
      const date = new Date(t.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${String(month).padStart(2, "0")}`;
      if (!byMonth.has(key)) byMonth.set(key, { month, year, items: [] });
      byMonth.get(key)!.items.push({
        description: t.description,
        amount: t.amount,
        installmentNumber: t.installmentNumber ?? 0,
        installmentTotal: t.installmentTotal ?? 0,
      });
    }
    return Array.from(byMonth.values())
      .map((e) => ({
        month: e.month,
        year: e.year,
        monthLabel: `${getMonthName(e.month)} ${e.year}`,
        totalAmount: roundMoney(e.items.reduce((s, i) => s + i.amount, 0)),
        installments: e.items,
      }))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }
}
