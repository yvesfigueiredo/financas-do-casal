import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { SimulationInput, SimulationResult, SimulationMonth } from "../models/types";
import {
  calculateInstallmentValue,
  getMonthName,
  roundMoney,
} from "../utils/helpers";

export class SimulationService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly recurringRepo: RecurringExpenseRepository
  ) {}

  async simulate(input: SimulationInput): Promise<SimulationResult> {
    const now = new Date();
    const months: SimulationMonth[] = [];
    let totalImpact = 0;
    let runningBalance = 0;

    // Busca dados existentes como base do saldo
    const currentTx = await this.transactionRepo.findByPeriod(now.getMonth() + 1, now.getFullYear());
    runningBalance = roundMoney(
      currentTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) -
        currentTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    );

    const monthsToProject = input.type === "installment" ? (input.installmentCount ?? 1) : 12;

    for (let i = 0; i < monthsToProject; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();

      let impact = 0;

      if (input.type === "purchase") {
        impact = i === 0 ? input.amount : 0;
      } else if (input.type === "installment") {
        const installmentValue = calculateInstallmentValue(input.amount, input.installmentCount ?? 1);
        impact = installmentValue;
        totalImpact += impact;
      } else if (input.type === "recurring") {
        // Aplica conforme periodicidade
        impact = this.getRecurringImpact(input, i);
        if (impact > 0) totalImpact += impact;
      }

      runningBalance = roundMoney(runningBalance - impact);
      months.push({
        month: tMonth,
        year: tYear,
        monthLabel: `${getMonthName(tMonth)} ${tYear}`,
        impact: roundMoney(impact),
        projectedBalance: runningBalance,
      });
    }

    if (input.type === "purchase") totalImpact = input.amount;

    // Impacto no cartão de crédito
    let cardImpact = null;
    if (input.creditCardId) {
      const card = await this.cardRepo.findById(input.creditCardId);
      if (card) {
        const { start, end } = { start: new Date(), end: new Date() };
        const usedNow = 0; // simplificado
        const newUsed = roundMoney(usedNow + input.amount);
        cardImpact = {
          cardId: card.id,
          cardName: card.name,
          newUsed,
          newAvailable: roundMoney(Math.max(0, card.limit - newUsed)),
        };
      }
    }

    return { input, monthlyImpact: months, totalImpact: roundMoney(totalImpact), cardImpact };
  }

  private getRecurringImpact(input: SimulationInput, monthIndex: number): number {
    if (!input.periodicity) return 0;
    switch (input.periodicity) {
      case "monthly": return input.amount;
      case "weekly": return roundMoney(input.amount * 4.33);
      case "biweekly": return roundMoney(input.amount * 2.17);
      case "quarterly": return monthIndex % 3 === 0 ? input.amount : 0;
      case "semiannual": return monthIndex % 6 === 0 ? input.amount : 0;
      case "annual": return monthIndex % 12 === 0 ? input.amount : 0;
      default: return 0;
    }
  }
}
