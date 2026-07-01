import { CreditCardRepository } from "../repositories/credit-card.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  CreditCard,
  CreditCardWithStats,
  CreateCreditCardDTO,
  UpdateCreditCardDTO,
} from "../models/types";
import { NotFoundError } from "../utils/errors";
import { getCardBillingPeriod, roundMoney } from "../utils/helpers";

export class CreditCardService {
  constructor(
    private readonly cardRepo: CreditCardRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly userRepo: UserRepository
  ) {}

  async getAll(userId?: string): Promise<CreditCardWithStats[]> {
    const cards = await this.cardRepo.findAll(userId);
    return Promise.all(cards.map((c) => this.buildStats(c)));
  }

  async getActive(userId?: string): Promise<CreditCardWithStats[]> {
    const cards = await this.cardRepo.findActive(userId);
    return Promise.all(cards.map((c) => this.buildStats(c)));
  }

  async getById(id: string): Promise<CreditCardWithStats> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new NotFoundError("Cartão");
    return this.buildStats(card);
  }

  async create(data: CreateCreditCardDTO): Promise<CreditCard> {
    const user = await this.userRepo.findById(data.userId);
    if (!user) throw new NotFoundError("Usuário");
    return this.cardRepo.create(data);
  }

  async update(id: string, data: UpdateCreditCardDTO): Promise<CreditCard> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new NotFoundError("Cartão");
    return this.cardRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new NotFoundError("Cartão");
    await this.cardRepo.delete(id);
  }

  async toggleActive(id: string): Promise<CreditCard> {
    const card = await this.cardRepo.findById(id);
    if (!card) throw new NotFoundError("Cartão");
    return this.cardRepo.update(id, { active: !card.active });
  }

  // Calcula estatísticas do cartão: gasto atual, disponível, próxima fatura
  private async buildStats(card: CreditCard): Promise<CreditCardWithStats> {
    const now = new Date();
    // Período da fatura atual
    const { start, end } = getCardBillingPeriod(card.closingDay, now);
    // Total gasto no período atual da fatura
    const used = await this.transactionRepo.getCardTotalForPeriod(card.id, start, end);
    const available = roundMoney(card.limit - used);
    const usagePercent = card.limit > 0 ? roundMoney((used / card.limit) * 100) : 0;

    // Próxima fatura: gasto no próximo período
    const nextStart = new Date(end);
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    const nextInvoiceAmount = await this.transactionRepo.getCardTotalForPeriod(card.id, nextStart, nextEnd);

    // Contagem de compras no período atual
    const filters = { creditCardId: card.id, page: 1, limit: 1 };
    const txResult = await this.transactionRepo.findMany(filters);

    return {
      ...card,
      used: roundMoney(used),
      available: roundMoney(Math.max(0, available)),
      usagePercent,
      purchaseCount: txResult.total,
      nextInvoiceAmount: roundMoney(nextInvoiceAmount),
    };
  }
}
