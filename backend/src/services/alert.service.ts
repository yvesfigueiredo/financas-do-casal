import { AlertRepository } from "../repositories/alert.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { Alert } from "../models/types";
import { getCardBillingPeriod, roundMoney } from "../utils/helpers";

export class AlertService {
  constructor(
    private readonly alertRepo: AlertRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly installmentRepo: InstallmentRepository,
    private readonly accountRepo: BankAccountRepository,
    private readonly transactionRepo: TransactionRepository
  ) {}

  async getAll(): Promise<{ alerts: Alert[]; unreadCount: number }> {
    const [alerts, unreadCount] = await Promise.all([
      this.alertRepo.findAll(false),
      this.alertRepo.countUnread(),
    ]);
    return { alerts, unreadCount };
  }

  async markRead(ids: string[]): Promise<void> {
    await this.alertRepo.markRead(ids);
  }

  async dismiss(ids: string[]): Promise<void> {
    await this.alertRepo.dismiss(ids);
  }

  // Executa a varredura de alertas — chamada ao iniciar servidor e periodicamente
  async runAlertScan(): Promise<void> {
    await Promise.all([
      this.checkCardClosingTomorrow(),
      this.checkRecurringDueTomorrow(),
      this.checkCardLimitHigh(),
      this.checkInstallmentsEnding(),
      this.checkNegativeBalance(),
    ]);
    // Limpa alertas dispensados com mais de 30 dias
    await this.alertRepo.deleteOld(30);
  }

  private async checkCardClosingTomorrow(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const closingDay = tomorrow.getDate();

    const cards = await this.cardRepo.findActive();
    for (const card of cards) {
      if (card.closingDay !== closingDay) continue;
      const alreadyExists = await this.alertRepo.existsToday("card_closing_tomorrow", card.id);
      if (alreadyExists) continue;

      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      await this.alertRepo.create({
        type: "card_closing_tomorrow",
        title: `Fechamento amanhã — ${card.name}`,
        message: `O cartão ${card.name} fecha amanhã com R$ ${roundMoney(used).toFixed(2)} em gastos.`,
        creditCardId: card.id,
        dueDate: tomorrow,
      });
    }
  }

  private async checkRecurringDueTomorrow(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDay = tomorrow.getDate();

    const expenses = await this.recurringRepo.findAll(undefined, true);
    for (const expense of expenses) {
      if (expense.dueDay !== dueDay) continue;
      const alreadyExists = await this.alertRepo.existsToday("bill_due_tomorrow", expense.id);
      if (alreadyExists) continue;
      await this.alertRepo.create({
        type: "bill_due_tomorrow",
        title: `Conta vence amanhã — ${expense.description}`,
        message: `${expense.description} vence amanhã no valor de R$ ${expense.amount.toFixed(2)}.`,
        recurringExpenseId: expense.id,
        dueDate: tomorrow,
      });
    }
  }

  private async checkCardLimitHigh(): Promise<void> {
    const cards = await this.cardRepo.findActive();
    for (const card of cards) {
      const { start, end } = getCardBillingPeriod(card.closingDay);
      const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
      const percent = card.limit > 0 ? (used / card.limit) * 100 : 0;
      if (percent < 80) continue;
      const alreadyExists = await this.alertRepo.existsToday("card_limit_high", card.id);
      if (alreadyExists) continue;
      await this.alertRepo.create({
        type: "card_limit_high",
        title: `Limite alto — ${card.name}`,
        message: `${card.name} está com ${percent.toFixed(0)}% do limite utilizado (R$ ${roundMoney(used).toFixed(2)} de R$ ${card.limit.toFixed(2)}).`,
        creditCardId: card.id,
      });
    }
  }

  private async checkInstallmentsEnding(): Promise<void> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const installments = await this.installmentRepo.findAll();
    for (const inst of installments) {
      const transactions = inst.transactions ?? [];
      if (transactions.length === 0) continue;
      const pending = transactions.filter((t) => new Date(t.date) > now);
      if (pending.length !== 1) continue; // só alerta quando resta 1 parcela
      const alreadyExists = await this.alertRepo.existsToday("installment_ending", inst.id);
      if (alreadyExists) continue;
      await this.alertRepo.create({
        type: "installment_ending",
        title: `Última parcela — ${inst.description}`,
        message: `${inst.description} tem apenas 1 parcela restante.`,
        installmentId: inst.id,
        dueDate: nextMonth,
      });
    }
  }

  private async checkNegativeBalance(): Promise<void> {
    const accounts = await this.accountRepo.findActive();
    for (const account of accounts) {
      if (account.currentBalance >= 0) continue;
      const alreadyExists = await this.alertRepo.existsToday("negative_balance");
      if (alreadyExists) continue;
      await this.alertRepo.create({
        type: "negative_balance",
        title: `Saldo negativo — ${account.name}`,
        message: `A conta ${account.name} está com saldo negativo: R$ ${account.currentBalance.toFixed(2)}.`,
      });
    }
  }
}
