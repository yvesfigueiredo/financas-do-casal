import { TransactionRepository } from "../repositories/transaction.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { TimelineEvent } from "../models/types";
import { formatDateLabel, getCardBillingPeriod, roundMoney } from "../utils/helpers";

export class TimelineService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly recurringRepo: RecurringExpenseRepository,
    private readonly cardRepo: CreditCardRepository,
    private readonly accountRepo: BankAccountRepository
  ) {}

  // Monta a linha do tempo cronológica considerando todas as fontes de eventos futuros
  async getTimeline(daysAhead: number, userId?: string): Promise<TimelineEvent[]> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);

    const events: TimelineEvent[] = [];

    // 1. Transações futuras já lançadas (parcelas, receitas/despesas agendadas)
    const transactions = await this.transactionRepo.findFutureInstallmentsRange(now, endDate);
    for (const t of transactions) {
      events.push({
        id: `tx-${t.id}`,
        date: new Date(t.date),
        dateLabel: formatDateLabel(new Date(t.date)),
        title: t.installmentTotal
          ? `${t.description.replace(/ - Parcela \d+\/\d+$/, "")} (${t.installmentNumber}/${t.installmentTotal})`
          : t.description,
        amount: t.amount,
        type: t.installmentId ? "installment" : t.type,
        category: t.category.name,
        userName: t.user.name,
        projectedBalance: 0, // calculado depois
        cardName: t.creditCard?.name,
        installmentInfo: t.installmentTotal ? `${t.installmentNumber}/${t.installmentTotal}` : undefined,
      });
    }

    // 2. Contas fixas recorrentes — projeta próximas ocorrências dentro do período
    const recurring = await this.recurringRepo.findAll(userId, true);
    for (const r of recurring) {
      let occDate = new Date(now.getFullYear(), now.getMonth(), r.dueDay);
      if (occDate < now) occDate.setMonth(occDate.getMonth() + 1);

      while (occDate <= endDate) {
        events.push({
          id: `rec-${r.id}-${occDate.getTime()}`,
          date: new Date(occDate),
          dateLabel: formatDateLabel(occDate),
          title: r.description,
          amount: r.amount,
          type: "recurring",
          category: r.category?.name ?? "Outros",
          userName: r.user?.name ?? "—",
          projectedBalance: 0,
          cardName: r.creditCard?.name,
        });
        // Avança conforme periodicidade (simplificado para mensal na linha do tempo de curto prazo)
        if (r.periodicity === "monthly") occDate.setMonth(occDate.getMonth() + 1);
        else if (r.periodicity === "weekly") occDate.setDate(occDate.getDate() + 7);
        else if (r.periodicity === "biweekly") occDate.setDate(occDate.getDate() + 14);
        else if (r.periodicity === "quarterly") occDate.setMonth(occDate.getMonth() + 3);
        else if (r.periodicity === "semiannual") occDate.setMonth(occDate.getMonth() + 6);
        else if (r.periodicity === "annual") occDate.setFullYear(occDate.getFullYear() + 1);
        else break;
      }
    }

    // 3. Faturas de cartão — próximo vencimento dentro do período
    const cards = await this.cardRepo.findActive(userId);
    for (const card of cards) {
      let dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay);
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

      if (dueDate <= endDate) {
        const { start, end } = getCardBillingPeriod(card.closingDay);
        const amount = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
        if (amount > 0) {
          events.push({
            id: `invoice-${card.id}-${dueDate.getTime()}`,
            date: dueDate,
            dateLabel: formatDateLabel(dueDate),
            title: `Fatura ${card.name}`,
            amount: roundMoney(amount),
            type: "invoice",
            category: "Cartão de Crédito",
            userName: card.user?.name ?? "—",
            projectedBalance: 0,
            cardName: card.name,
          });
        }
      }
    }

    // Ordena cronologicamente
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcula saldo previsto acumulado a partir do saldo atual das contas
    const accounts = await this.accountRepo.findActive(userId);
    let runningBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

    for (const event of events) {
      if (event.type === "income") {
        runningBalance += event.amount;
      } else {
        runningBalance -= event.amount;
      }
      event.projectedBalance = roundMoney(runningBalance);
    }

    return events;
  }
}
