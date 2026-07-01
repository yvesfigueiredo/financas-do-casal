import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { FinancialInsight } from "../models/types";
import { getCardBillingPeriod, getMonthName, roundMoney } from "../utils/helpers";

export class FinancialAssistantService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly installmentRepo: InstallmentRepository,
    private readonly goalRepo: FinancialGoalRepository
  ) {}

  // Gera insights 100% dinâmicos a partir dos dados reais — nunca mensagens fixas
  async generateInsights(userId?: string): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const now = new Date();

    const [
      spendingInsights,
      categoryInsights,
      cardInsights,
      installmentInsights,
      goalInsights,
      trendInsights,
    ] = await Promise.all([
      this.analyzeSpendingIncrease(userId, now),
      this.analyzeCategoryAnomalies(userId, now),
      this.analyzeCardUsage(userId),
      this.analyzeInstallmentLoad(userId, now),
      this.analyzeGoalProgress(userId),
      this.analyzePositiveTrends(userId, now),
    ]);

    insights.push(...spendingInsights, ...categoryInsights, ...cardInsights, ...installmentInsights, ...goalInsights, ...trendInsights);

    // Ordena por severidade: critical > warning > positive > info
    const severityOrder = { critical: 0, warning: 1, positive: 2, info: 3 };
    return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  // Compara gasto do mês atual com a média dos últimos 3 meses
  private async analyzeSpendingIncrease(userId: string | undefined, now: Date): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentTx = await this.transactionRepo.findByPeriod(currentMonth, currentYear, userId);
    const currentExpense = currentTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const pastMonths: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const tx = await this.transactionRepo.findByPeriod(d.getMonth() + 1, d.getFullYear(), userId);
      pastMonths.push(tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
    }

    const validPast = pastMonths.filter((v) => v > 0);
    if (validPast.length === 0) return insights;

    const avgPast = validPast.reduce((s, v) => s + v, 0) / validPast.length;
    if (avgPast === 0) return insights;

    const variation = ((currentExpense - avgPast) / avgPast) * 100;

    if (variation > 25) {
      insights.push({
        id: `spending-increase-${currentMonth}-${currentYear}`,
        type: "spending_increase",
        title: `Gastos ${variation.toFixed(0)}% acima da média`,
        description: `Você gastou R$ ${roundMoney(currentExpense).toFixed(2)} em ${getMonthName(currentMonth)}, contra uma média de R$ ${roundMoney(avgPast).toFixed(2)} nos últimos 3 meses.`,
        severity: variation > 50 ? "critical" : "warning",
        data: { current: roundMoney(currentExpense), average: roundMoney(avgPast), variation: roundMoney(variation) },
        recommendation: variation > 50
          ? "Revise os lançamentos deste mês para identificar gastos atípicos e corte o que não for essencial."
          : "Monitore as próximas semanas para evitar que esse padrão se repita.",
        generatedAt: now,
      });
    } else if (variation < -15) {
      insights.push({
        id: `spending-decrease-${currentMonth}-${currentYear}`,
        type: "positive_trend",
        title: `Gastos ${Math.abs(variation).toFixed(0)}% abaixo da média`,
        description: `Você economizou em relação à média dos últimos meses, gastando R$ ${roundMoney(currentExpense).toFixed(2)} contra R$ ${roundMoney(avgPast).toFixed(2)}.`,
        severity: "positive",
        data: { current: roundMoney(currentExpense), average: roundMoney(avgPast), variation: roundMoney(variation) },
        recommendation: "Considere direcionar a diferença economizada para sua reserva de emergência ou objetivos.",
        generatedAt: now,
      });
    }

    return insights;
  }

  // Identifica categorias com crescimento anormal de gasto
  private async analyzeCategoryAnomalies(userId: string | undefined, now: Date): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);

    const [currentTx, lastTx] = await Promise.all([
      this.transactionRepo.findByPeriod(currentMonth, currentYear, userId),
      this.transactionRepo.findByPeriod(lastMonthDate.getMonth() + 1, lastMonthDate.getFullYear(), userId),
    ]);

    const currentByCategory = new Map<string, number>();
    for (const t of currentTx.filter((t) => t.type === "expense")) {
      currentByCategory.set(t.category.name, (currentByCategory.get(t.category.name) ?? 0) + t.amount);
    }
    const lastByCategory = new Map<string, number>();
    for (const t of lastTx.filter((t) => t.type === "expense")) {
      lastByCategory.set(t.category.name, (lastByCategory.get(t.category.name) ?? 0) + t.amount);
    }

    for (const [category, currentValue] of currentByCategory.entries()) {
      const lastValue = lastByCategory.get(category) ?? 0;
      if (lastValue < 50) continue; // ignora categorias sem histórico relevante
      const variation = ((currentValue - lastValue) / lastValue) * 100;
      if (variation > 40) {
        insights.push({
          id: `category-${category}-${currentMonth}-${currentYear}`,
          type: "category_alert",
          title: `${category} cresceu ${variation.toFixed(0)}%`,
          description: `Gastos em ${category} passaram de R$ ${roundMoney(lastValue).toFixed(2)} para R$ ${roundMoney(currentValue).toFixed(2)} no último mês.`,
          severity: variation > 80 ? "critical" : "warning",
          data: { category, current: roundMoney(currentValue), previous: roundMoney(lastValue), variation: roundMoney(variation) },
          recommendation: `Avalie os lançamentos de ${category} para identificar o que causou esse aumento.`,
          generatedAt: now,
        });
      }
    }

    return insights.slice(0, 3); // limita a 3 categorias mais relevantes
  }

  // Analisa uso elevado de cartões
  private async analyzeCardUsage(userId: string | undefined): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const cards = await this.cardRepo.findActive(userId);

    for (const card of cards) {
      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      const percent = card.limit > 0 ? (used / card.limit) * 100 : 0;

      if (percent > 75) {
        insights.push({
          id: `card-usage-${card.id}`,
          type: "card_usage",
          title: `${card.name} com ${percent.toFixed(0)}% do limite`,
          description: `Você já utilizou R$ ${roundMoney(used).toFixed(2)} dos R$ ${card.limit.toFixed(2)} disponíveis neste cartão.`,
          severity: percent > 90 ? "critical" : "warning",
          data: { cardName: card.name, used: roundMoney(used), limit: card.limit, percent: roundMoney(percent) },
          recommendation: percent > 90
            ? `Evite novas compras no ${card.name} até o próximo fechamento de fatura.`
            : `Monitore o uso do ${card.name} para não comprometer o limite disponível.`,
          generatedAt: new Date(),
        });
      }
    }

    return insights;
  }

  // Analisa carga total de parcelamentos sobre a renda
  private async analyzeInstallmentLoad(userId: string | undefined, now: Date): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentTx = await this.transactionRepo.findByPeriod(currentMonth, currentYear, userId);
    const income = currentTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const installmentExpense = currentTx.filter((t) => t.type === "expense" && t.installmentId).reduce((s, t) => s + t.amount, 0);

    if (income > 0 && installmentExpense > 0) {
      const ratio = (installmentExpense / income) * 100;
      if (ratio > 30) {
        insights.push({
          id: `installment-load-${currentMonth}-${currentYear}`,
          type: "installment_load",
          title: `Parcelas consomem ${ratio.toFixed(0)}% da renda`,
          description: `Suas parcelas ativas somam R$ ${roundMoney(installmentExpense).toFixed(2)} de uma renda de R$ ${roundMoney(income).toFixed(2)} este mês.`,
          severity: ratio > 50 ? "critical" : "warning",
          data: { ratio: roundMoney(ratio), installmentTotal: roundMoney(installmentExpense), income: roundMoney(income) },
          recommendation: "Evite assumir novos parcelamentos até reduzir esse comprometimento para abaixo de 30% da renda.",
          generatedAt: now,
        });
      }
    }

    return insights;
  }

  // Analisa progresso de objetivos financeiros
  private async analyzeGoalProgress(userId: string | undefined): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const goals = await this.goalRepo.findAll(userId, true);
    const now = new Date();

    for (const goal of goals) {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

      if (goal.deadline) {
        const monthsRemaining = Math.max(0, (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const remaining = goal.targetAmount - goal.currentAmount;
        const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

        if (progress < 50 && monthsRemaining < 6 && monthsRemaining > 0) {
          insights.push({
            id: `goal-risk-${goal.id}`,
            type: "goal_progress",
            title: `Objetivo "${goal.title}" em risco`,
            description: `Apenas ${progress.toFixed(0)}% concluído com ${monthsRemaining.toFixed(0)} mês(es) restantes até o prazo.`,
            severity: "warning",
            data: { goalTitle: goal.title, progress: roundMoney(progress), requiredMonthly: roundMoney(requiredMonthly) },
            recommendation: `Será necessário contribuir R$ ${roundMoney(requiredMonthly).toFixed(2)} por mês para atingir a meta no prazo.`,
            generatedAt: now,
          });
        }
      }

      if (progress >= 100) {
        insights.push({
          id: `goal-complete-${goal.id}`,
          type: "goal_progress",
          title: `Objetivo "${goal.title}" concluído!`,
          description: `Você atingiu 100% da meta de R$ ${goal.targetAmount.toFixed(2)}.`,
          severity: "positive",
          data: { goalTitle: goal.title, progress: 100 },
          recommendation: "Considere definir um novo objetivo ou redirecionar essa contribuição para outra meta.",
          generatedAt: now,
        });
      }
    }

    return insights;
  }

  // Identifica tendências positivas (economia, redução de cartão, etc)
  private async analyzePositiveTrends(userId: string | undefined, now: Date): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentTx = await this.transactionRepo.findByPeriod(currentMonth, currentYear, userId);
    const income = currentTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = currentTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    if (savingsRate > 20) {
      insights.push({
        id: `savings-opportunity-${currentMonth}-${currentYear}`,
        type: "savings_opportunity",
        title: `Taxa de economia de ${savingsRate.toFixed(0)}%`,
        description: `Você está economizando R$ ${roundMoney(income - expense).toFixed(2)} este mês, uma taxa saudável de poupança.`,
        severity: "positive",
        data: { savingsRate: roundMoney(savingsRate), savedAmount: roundMoney(income - expense) },
        recommendation: "Considere investir parte desse valor em uma reserva de emergência ou aplicação financeira.",
        generatedAt: now,
      });
    }

    return insights;
  }
}
