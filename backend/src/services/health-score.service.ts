import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { HealthScore, HealthCriteria, HealthRecommendation } from "../models/types";
import { getCardBillingPeriod, roundMoney } from "../utils/helpers";

export class HealthScoreService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly installmentRepo: InstallmentRepository,
    private readonly accountRepo: BankAccountRepository
  ) {}

  async calculate(userId?: string): Promise<HealthScore> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const transactions = await this.transactionRepo.findByPeriod(month, year, userId);
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const criteria: HealthCriteria[] = [];

    // 1. Comprometimento da renda (peso 25%)
    const commitmentRatio = income > 0 ? (expense / income) * 100 : 100;
    const commitmentScore = this.scoreInverse(commitmentRatio, 50, 100); // 50% ideal, 100%+ péssimo
    criteria.push({
      name: "Comprometimento da Renda",
      score: commitmentScore,
      weight: 25,
      contribution: roundMoney((commitmentScore * 25) / 100),
      status: commitmentScore >= 70 ? "good" : commitmentScore >= 40 ? "warning" : "danger",
      detail: `${commitmentRatio.toFixed(0)}% da renda comprometida com despesas este mês`,
    });

    // 2. Uso dos cartões (peso 20%)
    const cards = await this.cardRepo.findActive(userId);
    let totalLimit = 0;
    let totalUsed = 0;
    for (const card of cards) {
      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      totalLimit += card.limit;
      totalUsed += used;
    }
    const cardUsageRatio = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    const cardScore = this.scoreInverse(cardUsageRatio, 30, 100);
    criteria.push({
      name: "Uso dos Cartões",
      score: cardScore,
      weight: 20,
      contribution: roundMoney((cardScore * 20) / 100),
      status: cardScore >= 70 ? "good" : cardScore >= 40 ? "warning" : "danger",
      detail: `${cardUsageRatio.toFixed(0)}% do limite total utilizado`,
    });

    // 3. Quantidade de parcelamentos ativos (peso 15%)
    const installments = await this.installmentRepo.findAll();
    const activeInstallments = installments.filter((i) => {
      const txs = i.transactions ?? [];
      return txs.some((t) => new Date(t.date) > now);
    });
    const installmentScore = this.scoreInverse(activeInstallments.length, 3, 10);
    criteria.push({
      name: "Quantidade de Parcelamentos",
      score: installmentScore,
      weight: 15,
      contribution: roundMoney((installmentScore * 15) / 100),
      status: installmentScore >= 70 ? "good" : installmentScore >= 40 ? "warning" : "danger",
      detail: `${activeInstallments.length} parcelamento(s) em andamento`,
    });

    // 4. Saldo previsto (peso 15%)
    const futureInstallments = await this.transactionRepo.findFutureInstallments(now, 1);
    const committedInstallments = futureInstallments.reduce((s, t) => s + t.amount, 0);
    const recurringExpenses = await this.recurringRepo.findAll(userId, true);
    const committedRecurring = recurringExpenses
      .filter((r) => r.periodicity === "monthly")
      .reduce((s, r) => s + r.amount, 0);
    const balance = income - expense;
    const forecastBalance = balance - committedInstallments - committedRecurring;
    const forecastScore = forecastBalance >= 0 ? Math.min(100, 60 + (forecastBalance / Math.max(income, 1)) * 100) : Math.max(0, 40 + (forecastBalance / Math.max(income, 1)) * 100);
    criteria.push({
      name: "Saldo Previsto",
      score: Math.max(0, Math.min(100, forecastScore)),
      weight: 15,
      contribution: roundMoney((Math.max(0, Math.min(100, forecastScore)) * 15) / 100),
      status: forecastBalance >= 0 ? "good" : forecastBalance >= -500 ? "warning" : "danger",
      detail: forecastBalance >= 0
        ? `Saldo positivo projetado de R$ ${forecastBalance.toFixed(2)}`
        : `Saldo negativo projetado de R$ ${forecastBalance.toFixed(2)}`,
    });

    // 5. Reserva financeira (peso 15%)
    const accounts = await this.accountRepo.findActive(userId);
    const totalReserve = accounts.reduce((s, a) => s + a.currentBalance, 0);
    const avgMonthlyExpense = expense > 0 ? expense : 1;
    const monthsProtected = totalReserve / avgMonthlyExpense;
    const reserveScore = Math.min(100, (monthsProtected / 6) * 100);
    criteria.push({
      name: "Reserva Financeira",
      score: reserveScore,
      weight: 15,
      contribution: roundMoney((reserveScore * 15) / 100),
      status: monthsProtected >= 6 ? "good" : monthsProtected >= 3 ? "warning" : "danger",
      detail: `${monthsProtected.toFixed(1)} mês(es) de despesas cobertos pela reserva`,
    });

    // 6. Contas recorrentes (peso 10%)
    const recurringRatio = income > 0 ? (committedRecurring / income) * 100 : 0;
    const recurringScore = this.scoreInverse(recurringRatio, 30, 70);
    criteria.push({
      name: "Contas Recorrentes",
      score: recurringScore,
      weight: 10,
      contribution: roundMoney((recurringScore * 10) / 100),
      status: recurringScore >= 70 ? "good" : recurringScore >= 40 ? "warning" : "danger",
      detail: `${recurringRatio.toFixed(0)}% da renda comprometida com contas fixas`,
    });

    const totalScore = Math.round(criteria.reduce((s, c) => s + c.contribution, 0));
    const grade = this.scoreToGrade(totalScore);
    const recommendations = this.buildRecommendations(criteria, {
      commitmentRatio, cardUsageRatio, activeInstallmentsCount: activeInstallments.length,
      forecastBalance, monthsProtected, recurringRatio,
    });

    return {
      score: totalScore,
      grade,
      label: this.gradeLabel(grade),
      breakdown: criteria,
      recommendations,
      calculatedAt: now,
    };
  }

  // Quanto MENOR o valor, MAIOR a pontuação (inverso) — usado para % de comprometimento
  private scoreInverse(value: number, idealMax: number, worstAt: number): number {
    if (value <= idealMax) return 100;
    if (value >= worstAt) return 0;
    return Math.round(100 - ((value - idealMax) / (worstAt - idealMax)) * 100);
  }

  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    if (score >= 30) return "D";
    return "F";
  }

  private gradeLabel(grade: string): string {
    const labels: Record<string, string> = {
      A: "Excelente saúde financeira",
      B: "Boa saúde financeira",
      C: "Saúde financeira razoável",
      D: "Saúde financeira preocupante",
      F: "Saúde financeira crítica",
    };
    return labels[grade] ?? "Indefinido";
  }

  private buildRecommendations(
    criteria: HealthCriteria[],
    data: {
      commitmentRatio: number; cardUsageRatio: number; activeInstallmentsCount: number;
      forecastBalance: number; monthsProtected: number; recurringRatio: number;
    }
  ): HealthRecommendation[] {
    const recs: HealthRecommendation[] = [];

    if (data.commitmentRatio > 80) {
      recs.push({
        priority: "high",
        title: "Reduza o comprometimento da renda",
        description: `Você está gastando ${data.commitmentRatio.toFixed(0)}% da sua renda mensal.`,
        action: "Revise despesas variáveis como lazer e alimentação fora de casa",
        impact: "Pode liberar até 15-20% da renda mensal",
      });
    }

    if (data.cardUsageRatio > 70) {
      recs.push({
        priority: "high",
        title: "Limite de cartão em risco",
        description: `${data.cardUsageRatio.toFixed(0)}% do limite total dos cartões está em uso.`,
        action: "Evite novas compras parceladas até reduzir o uso atual",
        impact: "Evita juros rotativos e protege seu score de crédito",
      });
    }

    if (data.activeInstallmentsCount > 5) {
      recs.push({
        priority: "medium",
        title: "Muitos parcelamentos simultâneos",
        description: `Você tem ${data.activeInstallmentsCount} parcelamentos em andamento.`,
        action: "Evite novos parcelamentos até quitar alguns dos atuais",
        impact: "Reduz o comprometimento de meses futuros",
      });
    }

    if (data.forecastBalance < 0) {
      recs.push({
        priority: "high",
        title: "Saldo previsto negativo",
        description: `O saldo projetado para o fim do mês é de R$ ${data.forecastBalance.toFixed(2)}.`,
        action: "Corte despesas não essenciais imediatamente ou antecipe receitas",
        impact: "Evita uso de cheque especial ou crédito emergencial",
      });
    }

    if (data.monthsProtected < 3) {
      recs.push({
        priority: data.monthsProtected < 1 ? "high" : "medium",
        title: "Reserva de emergência baixa",
        description: `Sua reserva cobre apenas ${data.monthsProtected.toFixed(1)} mês(es) de despesas.`,
        action: "Direcione parte da renda mensal para uma reserva até atingir 6 meses",
        impact: "Protege contra imprevistos sem recorrer a crédito",
      });
    }

    if (data.recurringRatio > 50) {
      recs.push({
        priority: "medium",
        title: "Contas fixas elevadas",
        description: `${data.recurringRatio.toFixed(0)}% da renda está comprometida com contas recorrentes.`,
        action: "Revise assinaturas e serviços recorrentes pouco utilizados",
        impact: "Pode reduzir o comprometimento fixo em 5-10%",
      });
    }

    const goodCriteria = criteria.filter((c) => c.status === "good");
    if (goodCriteria.length >= 4 && recs.length === 0) {
      recs.push({
        priority: "low",
        title: "Continue assim!",
        description: "Sua saúde financeira está em bom estado nos principais indicadores.",
        action: "Considere direcionar o excedente para investimentos de longo prazo",
        impact: "Acelera o crescimento patrimonial",
      });
    }

    return recs.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}
